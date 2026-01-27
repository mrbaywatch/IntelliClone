import { BookOpen, Loader2 } from 'lucide-react';

import { PageBody, PageHeader } from '@kit/ui/page';
import { Skeleton } from '@kit/ui/skeleton';
import { Card, CardContent, CardHeader } from '@kit/ui/card';

export default function ResearchLoading() {
  return (
    <>
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Juridisk Søk
          </div>
        }
        description={<Skeleton className="h-4 w-48" />}
      />

      <PageBody>
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-18" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[180px]" />
                <Skeleton className="h-10 w-20" />
              </div>
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
