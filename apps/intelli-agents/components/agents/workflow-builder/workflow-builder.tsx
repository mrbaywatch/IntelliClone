'use client';

import { useCallback, useRef, useState, useMemo } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { Workflow, WorkflowNode, WorkflowEdge, WorkflowNodeType } from '@/lib/agents/types';
import { TriggerNode } from './nodes/trigger-node';
import { ActionNode } from './nodes/action-node';
import { ConditionNode } from './nodes/condition-node';
import { AITaskNode } from './nodes/ai-task-node';
import { OutputNode } from './nodes/output-node';
import { NodePanel } from './node-panel';
import { NodeConfigPanel } from './node-config-panel';
import { Button } from '@kit/ui/button';
import { Save, Play, Undo, Redo, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// =============================================================================
// NODE TYPE MAPPING
// =============================================================================

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  ai_task: AITaskNode,
  integration: ActionNode, // Reuse action node for integrations
  delay: ActionNode,
  output: OutputNode,
};

// =============================================================================
// WORKFLOW BUILDER COMPONENT
// =============================================================================

interface WorkflowBuilderProps {
  workflow: Workflow;
  onChange: (workflow: Workflow) => void;
  onSave?: () => void;
  onTest?: () => void;
  readOnly?: boolean;
}

function WorkflowBuilderInner({
  workflow,
  onChange,
  onSave,
  onTest,
  readOnly = false,
}: WorkflowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project, fitView, zoomIn, zoomOut } = useReactFlow();

  // Convert workflow to React Flow format
  const initialNodes = useMemo(() => {
    return workflow.nodes.map((node): Node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      draggable: !readOnly,
      selectable: true,
    }));
  }, [workflow.nodes, readOnly]);

  const initialEdges = useMemo(() => {
    return workflow.edges.map((edge): Edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type || 'smoothstep',
      label: edge.label,
      animated: edge.animated,
      style: { strokeWidth: 2 },
    }));
  }, [workflow.edges]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isNodePanelOpen, setIsNodePanelOpen] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([
    { nodes: initialNodes, edges: initialEdges },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Update parent when workflow changes
  const updateWorkflow = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      const newWorkflow: Workflow = {
        nodes: newNodes.map((node): WorkflowNode => ({
          id: node.id,
          type: node.type as WorkflowNodeType,
          position: node.position,
          data: node.data,
          width: node.width,
          height: node.height,
        })),
        edges: newEdges.map((edge): WorkflowEdge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || undefined,
          targetHandle: edge.targetHandle || undefined,
          type: edge.type,
          label: edge.label as string | undefined,
          animated: edge.animated,
        })),
        viewport: workflow.viewport,
      };
      onChange(newWorkflow);
    },
    [onChange, workflow.viewport]
  );

  // Add to history
  const addToHistory = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ nodes: newNodes, edges: newEdges });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  // Node changes
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const newNodes = applyNodeChanges(changes, nodes);
      setNodes(newNodes);

      // Only add to history for position changes (not selection)
      const hasPositionChange = changes.some((c) => c.type === 'position' && !c.dragging);
      if (hasPositionChange) {
        addToHistory(newNodes, edges);
        updateWorkflow(newNodes, edges);
      }
    },
    [nodes, edges, addToHistory, updateWorkflow]
  );

  // Edge changes
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const newEdges = applyEdgeChanges(changes, edges);
      setEdges(newEdges);

      // Add to history for removals
      const hasRemoval = changes.some((c) => c.type === 'remove');
      if (hasRemoval) {
        addToHistory(nodes, newEdges);
        updateWorkflow(nodes, newEdges);
      }
    },
    [nodes, edges, addToHistory, updateWorkflow]
  );

  // Connect nodes
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const newEdges = addEdge(
        {
          ...connection,
          type: 'smoothstep',
          style: { strokeWidth: 2 },
        },
        edges
      );
      setEdges(newEdges);
      addToHistory(nodes, newEdges);
      updateWorkflow(nodes, newEdges);
    },
    [nodes, edges, addToHistory, updateWorkflow]
  );

  // Node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Background click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Drop new node
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const nodeData = JSON.parse(event.dataTransfer.getData('node-data') || '{}');

      if (!type || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: nodeData.label || `New ${type}`,
          icon: nodeData.icon,
          color: nodeData.color,
          ...nodeData,
        },
      };

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      addToHistory(newNodes, edges);
      updateWorkflow(newNodes, edges);
      setSelectedNode(newNode);
    },
    [project, nodes, edges, addToHistory, updateWorkflow]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Update node data
  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<WorkflowNode['data']>) => {
      const newNodes = nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      );
      setNodes(newNodes);
      addToHistory(newNodes, edges);
      updateWorkflow(newNodes, edges);

      // Update selected node reference
      if (selectedNode?.id === nodeId) {
        setSelectedNode(newNodes.find((n) => n.id === nodeId) || null);
      }
    },
    [nodes, edges, selectedNode, addToHistory, updateWorkflow]
  );

  // Delete node
  const deleteNode = useCallback(
    (nodeId: string) => {
      const newNodes = nodes.filter((n) => n.id !== nodeId);
      const newEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      setNodes(newNodes);
      setEdges(newEdges);
      addToHistory(newNodes, newEdges);
      updateWorkflow(newNodes, newEdges);
      setSelectedNode(null);
    },
    [nodes, edges, addToHistory, updateWorkflow]
  );

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      if (state) {
        setNodes(state.nodes);
        setEdges(state.edges);
        setHistoryIndex(newIndex);
        updateWorkflow(state.nodes, state.edges);
      }
    }
  }, [history, historyIndex, updateWorkflow]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      if (state) {
        setNodes(state.nodes);
        setEdges(state.edges);
        setHistoryIndex(newIndex);
        updateWorkflow(state.nodes, state.edges);
      }
    }
  }, [history, historyIndex, updateWorkflow]);

  return (
    <div className="flex h-full w-full">
      {/* Main Flow Canvas */}
      <div ref={reactFlowWrapper} className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { strokeWidth: 2 },
          }}
          connectionLineStyle={{ strokeWidth: 2 }}
          deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']}
        >
          <Background gap={15} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="bg-background border rounded-lg"
          />

          {/* Top Toolbar */}
          <Panel position="top-left" className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNodePanelOpen(!isNodePanelOpen)}
            >
              {isNodePanelOpen ? 'Hide Nodes' : 'Add Node'}
            </Button>
          </Panel>

          <Panel position="top-center" className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => zoomIn()}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => zoomOut()}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fitView()}
              title="Fit View"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </Panel>

          <Panel position="top-right" className="flex gap-2">
            {onTest && (
              <Button variant="outline" size="sm" onClick={onTest}>
                <Play className="h-4 w-4 mr-2" />
                Test
              </Button>
            )}
            {onSave && (
              <Button size="sm" onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Lagre
              </Button>
            )}
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Panel (for adding new nodes) */}
      {isNodePanelOpen && (
        <NodePanel onClose={() => setIsNodePanelOpen(false)} />
      )}

      {/* Node Config Panel (for editing selected node) */}
      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onUpdate={(data) => updateNodeData(selectedNode.id, data)}
          onDelete={() => deleteNode(selectedNode.id)}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

// Wrap with provider
export function WorkflowBuilder(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}

export default WorkflowBuilder;
