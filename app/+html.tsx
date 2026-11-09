import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web page shell (static export). The only change from Expo's default is the viewport:
 * phones render the whole app at 88% so it feels sized for mobile; desktop browsers ignore this tag.
 * maximum-scale stops iOS from auto-zooming into text fields (which would not zoom back out).
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=0.88, maximum-scale=0.88, viewport-fit=cover" />
        <meta name="theme-color" content="#594573" />
        <meta name="description" content="Track Every Won & Ringgit." />
        <title>Saku — Track Every Won &amp; Ringgit.</title>
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
