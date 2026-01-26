/**
 * Intelli-Agents Runtime
 * The execution engine that runs agent workflows
 */

import { nanoid } from 'nanoid';
import type {
  Agent,
  AgentExecution,
  ExecutionContext,
  ExecutionStep,
  ExecutionStatus,
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  StepOutput,
  TriggerPayload,
  ActionType,
} from '../types/index.js';
import { actionRegistry, type ActionResult } from '../actions/index.js';

// =============================================================================
// RUNTIME TYPES
// =============================================================================

export interface RuntimeConfig {
  /** Maximum execution time in milliseconds */
  maxExecutionTimeMs: number;
  /** Maximum number of steps to execute */
  maxSteps: number;
  /** Default timeout for individual actions */
  actionTimeoutMs: number;
  /** Enable detailed logging */
  debug: boolean;
  /** Callback for step completion */
  onStepComplete?: (step: ExecutionStep) => void;
  /** Callback for execution updates */
  onExecutionUpdate?: (execution: AgentExecution) => void;
}

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  maxExecutionTimeMs: 5 * 60 * 1000, // 5 minutes
  maxSteps: 100,
  actionTimeoutMs: 30 * 1000, // 30 seconds
  debug: false,
};

export interface ExecutionPlan {
  /** Ordered list of nodes to execute */
  steps: PlannedStep[];
  /** Starting node */
  startNodeId: string;
}

export interface PlannedStep {
  nodeId: string;
  node: WorkflowNode;
  dependencies: string[];
  isConditional: boolean;
}

// =============================================================================
// AGENT RUNTIME
// =============================================================================

/**
 * The Agent Runtime - executes agent workflows
 */
export class AgentRuntime {
  private config: RuntimeConfig;

  constructor(config: Partial<RuntimeConfig> = {}) {
    this.config = { ...DEFAULT_RUNTIME_CONFIG, ...config };
  }

  /**
   * Execute an agent with the given trigger payload
   */
  async execute(
    agent: Agent,
    triggerPayload: TriggerPayload,
    triggerId?: string
  ): Promise<AgentExecution> {
    const executionId = nanoid();
    const startTime = Date.now();

    // Initialize execution record
    const execution: AgentExecution = {
      id: executionId,
      agentId: agent.id,
      triggerId,
      status: 'running',
      triggerData: triggerPayload.data,
      context: {
        executionId,
        agentId: agent.id,
        accountId: agent.accountId,
        trigger: {
          id: triggerId || 'manual',
          type: 'manual',
          data: triggerPayload.data,
        },
        variables: { ...agent.config.variables },
        timestamp: new Date(),
        steps: {},
      },
      variables: { ...agent.config.variables },
      startedAt: new Date(),
      tokensUsed: 0,
      estimatedCost: 0,
      createdAt: new Date(),
    };

    this.log('Starting execution', { executionId, agentId: agent.id });

    try {
      // Build execution plan
      const plan = this.buildExecutionPlan(agent.workflow);
      this.log('Execution plan built', { steps: plan.steps.length });

      // Execute workflow
      const result = await this.executeWorkflow(
        agent,
        plan,
        execution
      );

      // Update final status
      execution.status = result.success ? 'completed' : 'failed';
      execution.completedAt = new Date();
      execution.durationMs = Date.now() - startTime;
      execution.outputData = result.output;

      if (!result.success) {
        execution.errorMessage = result.error;
        execution.errorDetails = result.errorDetails;
      }

      this.log('Execution completed', {
        executionId,
        status: execution.status,
        durationMs: execution.durationMs,
      });

      // Callback
      this.config.onExecutionUpdate?.(execution);

      return execution;

    } catch (error) {
      // Handle unexpected errors
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.durationMs = Date.now() - startTime;
      execution.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      execution.errorDetails = {
        stack: error instanceof Error ? error.stack : undefined,
      };

      this.log('Execution failed with error', {
        executionId,
        error: execution.errorMessage,
      });

      this.config.onExecutionUpdate?.(execution);

      return execution;
    }
  }

  /**
   * Build execution plan from workflow
   */
  buildExecutionPlan(workflow: Workflow): ExecutionPlan {
    const { nodes, edges } = workflow;

    // Find the trigger node (starting point)
    const triggerNode = nodes.find((n) => n.type === 'trigger');
    if (!triggerNode) {
      throw new Error('Workflow must have a trigger node');
    }

    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    const reverseAdjacency = new Map<string, string[]>();

    for (const node of nodes) {
      adjacency.set(node.id, []);
      reverseAdjacency.set(node.id, []);
    }

    for (const edge of edges) {
      adjacency.get(edge.source)?.push(edge.target);
      reverseAdjacency.get(edge.target)?.push(edge.source);
    }

    // Topological sort to determine execution order
    const visited = new Set<string>();
    const ordered: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // Visit dependencies first
      const deps = reverseAdjacency.get(nodeId) || [];
      for (const dep of deps) {
        visit(dep);
      }

      ordered.push(nodeId);
    };

    // Start from trigger and visit all reachable nodes
    const reachable = this.getReachableNodes(triggerNode.id, adjacency);
    for (const nodeId of reachable) {
      visit(nodeId);
    }

    // Build planned steps
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const steps: PlannedStep[] = ordered
      .filter((id) => id !== triggerNode.id) // Exclude trigger from execution
      .map((nodeId) => {
        const node = nodeMap.get(nodeId)!;
        const dependencies = reverseAdjacency.get(nodeId) || [];
        const isConditional = this.hasConditionalParent(nodeId, edges, nodeMap);

        return {
          nodeId,
          node,
          dependencies,
          isConditional,
        };
      });

    return {
      steps,
      startNodeId: triggerNode.id,
    };
  }

  /**
   * Execute the workflow according to the plan
   */
  private async executeWorkflow(
    agent: Agent,
    plan: ExecutionPlan,
    execution: AgentExecution
  ): Promise<{
    success: boolean;
    output?: Record<string, unknown>;
    error?: string;
    errorDetails?: Record<string, unknown>;
  }> {
    const startTime = Date.now();
    const executedSteps: ExecutionStep[] = [];
    let stepOrder = 0;

    // Track which branches are active (for conditional execution)
    const activeBranches = new Set<string>();
    activeBranches.add(plan.startNodeId);

    for (const plannedStep of plan.steps) {
      // Check timeout
      if (Date.now() - startTime > this.config.maxExecutionTimeMs) {
        return {
          success: false,
          error: 'Execution timeout exceeded',
          errorDetails: { maxExecutionTimeMs: this.config.maxExecutionTimeMs },
        };
      }

      // Check max steps
      if (stepOrder >= this.config.maxSteps) {
        return {
          success: false,
          error: 'Maximum steps exceeded',
          errorDetails: { maxSteps: this.config.maxSteps },
        };
      }

      // Check if this node should execute (all dependencies must be active)
      const shouldExecute = plannedStep.dependencies.every(
        (dep) => activeBranches.has(dep) || execution.context.steps[dep]?.status === 'completed'
      );

      if (!shouldExecute && plannedStep.isConditional) {
        this.log('Skipping node (conditional branch not taken)', {
          nodeId: plannedStep.nodeId,
        });
        continue;
      }

      // Execute the step
      const step = await this.executeStep(
        plannedStep,
        execution,
        stepOrder++
      );

      executedSteps.push(step);

      // Record step result
      execution.context.steps[plannedStep.nodeId] = {
        nodeId: plannedStep.nodeId,
        actionType: plannedStep.node.data.actionType,
        status: step.status,
        data: step.outputData as Record<string, unknown>,
        error: step.errorMessage,
        durationMs: step.durationMs || 0,
      };

      // Update variables from step output
      if (step.outputData) {
        Object.assign(execution.variables, step.outputData);
        Object.assign(execution.context.variables, step.outputData);
      }

      // Handle condition results (branching)
      if (plannedStep.node.type === 'condition' && step.outputData) {
        const conditionResult = (step.outputData as { result?: boolean }).result;
        if (conditionResult === true) {
          // Find and activate the 'true' branch
          const trueBranch = this.findConditionBranch(
            plannedStep.nodeId,
            'true',
            agent.workflow.edges
          );
          if (trueBranch) activeBranches.add(trueBranch);
        } else {
          // Find and activate the 'false' branch
          const falseBranch = this.findConditionBranch(
            plannedStep.nodeId,
            'false',
            agent.workflow.edges
          );
          if (falseBranch) activeBranches.add(falseBranch);
        }
      } else {
        // Normal node - activate all outgoing edges
        activeBranches.add(plannedStep.nodeId);
      }

      // Callback
      this.config.onStepComplete?.(step);

      // Handle step failure
      if (step.status === 'failed') {
        // Check if agent has retry config
        const retryConfig = agent.config.retry;
        if (retryConfig && retryConfig.maxAttempts > 0) {
          // TODO: Implement retry logic
        }

        return {
          success: false,
          error: step.errorMessage || 'Step execution failed',
          errorDetails: {
            failedStep: plannedStep.nodeId,
            failedAction: plannedStep.node.data.actionType,
          },
        };
      }
    }

    // Aggregate output from all steps
    const output = this.aggregateOutput(executedSteps, execution);

    return {
      success: true,
      output,
    };
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    plannedStep: PlannedStep,
    execution: AgentExecution,
    stepOrder: number
  ): Promise<ExecutionStep> {
    const { node } = plannedStep;
    const startTime = Date.now();

    const step: ExecutionStep = {
      id: nanoid(),
      executionId: execution.id,
      nodeId: plannedStep.nodeId,
      stepOrder,
      actionType: node.data.actionType,
      status: 'running',
      inputData: this.buildStepInput(node, execution.context),
      startedAt: new Date(),
      createdAt: new Date(),
    };

    this.log('Executing step', {
      nodeId: plannedStep.nodeId,
      actionType: node.data.actionType,
      type: node.type,
    });

    try {
      let result: ActionResult;

      switch (node.type) {
        case 'action':
        case 'ai_task':
        case 'integration':
          if (!node.data.actionType || !node.data.actionConfig) {
            throw new Error('Action type and config are required');
          }
          result = await actionRegistry.execute(
            node.data.actionType,
            node.data.actionConfig,
            execution.context
          );
          break;

        case 'condition':
          if (!node.data.conditionConfig) {
            throw new Error('Condition config is required');
          }
          const conditionExecutor = actionRegistry.get('condition');
          if (!conditionExecutor) {
            throw new Error('Condition executor not found');
          }
          result = await conditionExecutor.execute(
            node.data.conditionConfig,
            execution.context
          );
          break;

        case 'delay':
          if (!node.data.delayConfig) {
            throw new Error('Delay config is required');
          }
          const delayExecutor = actionRegistry.get('delay');
          if (!delayExecutor) {
            throw new Error('Delay executor not found');
          }
          result = await delayExecutor.execute(
            node.data.delayConfig,
            execution.context
          );
          break;

        case 'output':
          // Output nodes just pass through data
          result = {
            success: true,
            data: step.inputData,
          };
          break;

        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // Update step with result
      step.status = result.success ? 'completed' : 'failed';
      step.outputData = result.data;
      step.errorMessage = result.error;

      // Track token usage
      if (result.tokensUsed) {
        execution.tokensUsed += result.tokensUsed;
        // Rough cost estimation ($0.002 per 1k tokens average)
        execution.estimatedCost += (result.tokensUsed / 1000) * 0.002;
      }

    } catch (error) {
      step.status = 'failed';
      step.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('Step failed', {
        nodeId: plannedStep.nodeId,
        error: step.errorMessage,
      });
    }

    step.completedAt = new Date();
    step.durationMs = Date.now() - startTime;

    return step;
  }

  /**
   * Build input data for a step based on the execution context
   */
  private buildStepInput(
    node: WorkflowNode,
    context: ExecutionContext
  ): Record<string, unknown> {
    return {
      trigger: context.trigger,
      variables: context.variables,
      previousSteps: context.steps,
    };
  }

  /**
   * Aggregate output from all executed steps
   */
  private aggregateOutput(
    steps: ExecutionStep[],
    execution: AgentExecution
  ): Record<string, unknown> {
    const output: Record<string, unknown> = {
      variables: execution.variables,
      stepResults: {},
    };

    for (const step of steps) {
      if (step.outputData) {
        (output.stepResults as Record<string, unknown>)[step.nodeId] = step.outputData;
      }
    }

    // Find the last output node and use its data as primary output
    const outputSteps = steps.filter(
      (s) => s.outputData && s.status === 'completed'
    );
    if (outputSteps.length > 0) {
      const lastOutput = outputSteps[outputSteps.length - 1];
      output.result = lastOutput?.outputData;
    }

    return output;
  }

  /**
   * Get all nodes reachable from a starting node
   */
  private getReachableNodes(
    startNodeId: string,
    adjacency: Map<string, string[]>
  ): Set<string> {
    const reachable = new Set<string>();
    const queue = [startNodeId];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (reachable.has(nodeId)) continue;
      reachable.add(nodeId);

      const neighbors = adjacency.get(nodeId) || [];
      queue.push(...neighbors);
    }

    return reachable;
  }

  /**
   * Check if a node has a conditional parent (condition node upstream)
   */
  private hasConditionalParent(
    nodeId: string,
    edges: WorkflowEdge[],
    nodeMap: Map<string, WorkflowNode>
  ): boolean {
    const incomingEdges = edges.filter((e) => e.target === nodeId);

    for (const edge of incomingEdges) {
      const sourceNode = nodeMap.get(edge.source);
      if (sourceNode?.type === 'condition') {
        return true;
      }
    }

    return false;
  }

  /**
   * Find the target node for a condition branch
   */
  private findConditionBranch(
    conditionNodeId: string,
    branch: 'true' | 'false',
    edges: WorkflowEdge[]
  ): string | null {
    // Look for edge with matching source handle
    const edge = edges.find(
      (e) =>
        e.source === conditionNodeId &&
        (e.sourceHandle === branch || e.label?.toLowerCase() === branch)
    );

    return edge?.target || null;
  }

  /**
   * Log helper (respects debug config)
   */
  private log(message: string, data?: Record<string, unknown>): void {
    if (this.config.debug) {
      console.log(`[AgentRuntime] ${message}`, data || '');
    }
  }
}

// =============================================================================
// WORKFLOW VALIDATOR
// =============================================================================

/**
 * Validates workflow structure
 */
export class WorkflowValidator {
  /**
   * Validate a workflow
   */
  validate(workflow: Workflow): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for trigger node
    const triggerNodes = workflow.nodes.filter((n) => n.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have at least one trigger node');
    }
    if (triggerNodes.length > 1) {
      warnings.push('Workflow has multiple trigger nodes');
    }

    // Check for orphan nodes (no connections)
    const connectedNodes = new Set<string>();
    for (const edge of workflow.edges) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }

    for (const node of workflow.nodes) {
      if (!connectedNodes.has(node.id) && node.type !== 'trigger') {
        warnings.push(`Node "${node.data.label}" is not connected to workflow`);
      }
    }

    // Check for cycles
    if (this.hasCycle(workflow)) {
      errors.push('Workflow contains a cycle (infinite loop)');
    }

    // Validate each node
    for (const node of workflow.nodes) {
      const nodeErrors = this.validateNode(node);
      errors.push(...nodeErrors);
    }

    // Check edge validity
    const nodeIds = new Set(workflow.nodes.map((n) => n.id));
    for (const edge of workflow.edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge references non-existent target node: ${edge.target}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check for cycles in the workflow graph
   */
  private hasCycle(workflow: Workflow): boolean {
    const adjacency = new Map<string, string[]>();

    for (const node of workflow.nodes) {
      adjacency.set(node.id, []);
    }

    for (const edge of workflow.edges) {
      adjacency.get(edge.source)?.push(edge.target);
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleFromNode = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = adjacency.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycleFromNode(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        if (hasCycleFromNode(node.id)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Validate individual node
   */
  private validateNode(node: WorkflowNode): string[] {
    const errors: string[] = [];

    if (!node.data.label) {
      errors.push(`Node ${node.id} must have a label`);
    }

    if (node.type === 'action' && !node.data.actionType) {
      errors.push(`Action node "${node.data.label}" must have an action type`);
    }

    if (node.type === 'condition' && !node.data.conditionConfig) {
      errors.push(`Condition node "${node.data.label}" must have condition config`);
    }

    if (node.type === 'trigger' && !node.data.triggerType) {
      errors.push(`Trigger node "${node.data.label}" must have a trigger type`);
    }

    return errors;
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

// =============================================================================
// SINGLETON INSTANCES
// =============================================================================

export const agentRuntime = new AgentRuntime();
export const workflowValidator = new WorkflowValidator();
