"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center py-10">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="font-semibold mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {error.message || "An unexpected error occurred."}
          </p>
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
