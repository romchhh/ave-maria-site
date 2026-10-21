import NotFoundView from "@/components/shared/NotFoundView";
import { MEDIA } from "@/lib/media";
import "./(site)/globals.css";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;1,6..96,400;1,6..96,500;1,6..96,600&family=Outfit:wght@300;400;500;600;700&display=swap";

export default function NotFound() {
  return (
    <html lang="uk">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={MEDIA.logo} type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={FONTS_HREF} />
        <title>404 | Ave Maria Beauty Lab</title>
      </head>
      <body>
        <NotFoundView />
      </body>
    </html>
  );
}
