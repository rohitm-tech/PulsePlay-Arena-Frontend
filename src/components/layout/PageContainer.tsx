import { cn } from '@/lib/utils';
import { siteNarrowColumn, sitePageMain, siteReadableColumn } from '@/lib/site-layout';

type Column = 'full' | 'narrow' | 'readable';

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** Default: main landmark */
  as?: 'main' | 'div';
  /**
   * full — content uses full `SITE_MAX` width
   * narrow — `max-w-md` form column, centered inside the same shell
   * readable — `max-w-3xl` for profile / dense forms
   */
  column?: Column;
};

export function PageContainer({ children, className, as: Tag = 'main', column = 'full' }: PageContainerProps) {
  const inner =
    column === 'narrow' ? <div className={siteNarrowColumn}>{children}</div> : column === 'readable' ? <div className={siteReadableColumn}>{children}</div> : children;

  return <Tag className={cn(sitePageMain, className)}>{inner}</Tag>;
}
