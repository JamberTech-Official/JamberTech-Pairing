import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="glass-panel rounded-3xl p-8 max-w-md w-full text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-3">404</h1>
        <p className="text-muted-foreground mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/" 
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-primary/20"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Generator
        </Link>
      </div>
    </div>
  );
}
