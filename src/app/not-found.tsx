import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className='flex min-h-screen items-center justify-center px-6'>
      <div className='text-center max-w-md'>
        {/* Icon */}
        <div className='flex justify-center mb-6'>
          <div className='relative'>
            <div className='w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center'>
              <AlertTriangle className='w-9 h-9 text-accent' strokeWidth={1.75} />
            </div>
            {/* Glow ring */}
            <div className='absolute inset-0 rounded-2xl bg-accent/5 blur-xl -z-10 mx-auto' />
          </div>
        </div>

        {/* Heading */}
        <div className='mb-3'>
          <span className='text-7xl font-bold text-accent tracking-tight'>404</span>
        </div>

        <h1 className='text-xl font-semibold text-foreground mb-2'>Page not found</h1>
        <p className='text-muted-foreground text-sm leading-relaxed mb-8'>The page you&apos;re looking for doesn&apos;t exist or has been moved. Try going back to the dashboard.</p>

        {/* Actions */}
        <div className='flex items-center justify-center gap-3'>
          <Button variant='outline' asChild>
            <Link href='/dashboard'>
              <Home className='w-4 h-4 mr-2' strokeWidth={1.75} />
              Dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link href='/' className='flex items-center'>
              <ArrowLeft className='w-4 h-4 mr-2' strokeWidth={1.75} />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
