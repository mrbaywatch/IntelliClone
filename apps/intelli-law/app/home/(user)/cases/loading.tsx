import { Briefcase, Loader2 } from 'lucide-react';

import { PageBody, PageHeader } from '@kit/ui/page';
import { Skeleton } from '@kit/ui/skeleton';
import { Card, CardContent, CardHeader } from '@kit/ui/card';

export default function CasesLoading() {
  return (
    <>
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Saker
          </div>
        }
        description={<Skeleton className="h-4 w-48" />}
      >
        <Skeleton className="h-10 w-24" />
      </PageHeader>

      <PageBody>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
