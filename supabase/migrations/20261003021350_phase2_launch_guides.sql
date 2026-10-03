-- Hand-reviewed launch guides for the public blog. Not an AI batch.

insert into public.blog_topics (slug, name, description, seo_title, seo_description, is_public)
values
  (
    'formats',
    'Formats',
    'How to choose an output format.',
    'File format guides',
    'Choose JPG, PNG, PDF, and other outputs with a clear reason.',
    true
  ),
  (
    'tutorials',
    'Tutorials',
    'Step-by-step tool guides.',
    'Tool tutorials',
    'Short tutorials for browser file tools.',
    true
  ),
  (
    'troubleshooting',
    'Troubleshooting',
    'Fixes for files that will not open or convert.',
    'File troubleshooting',
    'Why common files fail and what to try next.',
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  is_public = excluded.is_public;

insert into public.site_settings (key, value, is_public)
values (
  'homepage_guide_slugs',
  '["choose-the-right-file-format","convert-png-to-jpg-in-the-browser","why-a-heic-photo-will-not-open"]'::jsonb,
  true
)
on conflict (key) do update
set value = excluded.value, is_public = excluded.is_public;

insert into public.blog_posts (
  slug, title, excerpt, body, status, seo_title, seo_description, canonical_path,
  topic_id, tool_slugs, published_at, noindex, reading_minutes
)
select
  seed.slug,
  seed.title,
  seed.excerpt,
  seed.body,
  'published'::public.blog_post_status,
  seed.seo_title,
  seed.seo_description,
  '/blog/' || seed.slug,
  topic.id,
  seed.tool_slugs,
  timestamptz '2026-10-03 02:00:00+00',
  false,
  seed.reading_minutes
from (
  values
    (
      'choose-the-right-file-format',
      'formats',
      'How to choose the right file format',
      'A practical way to pick JPG, PNG, or PDF before you convert, and when a tool still needs a dedicated worker.',
      'How to choose the right file format',
      'Compare JPG, PNG, and PDF, then open the matching AllYouConvert tool. Browser tools stay on your device.',
      array['png-to-jpg', 'jpg-to-png', 'pdf-to-docx']::text[],
      3,
      $body1${
        "version": 1,
        "blocks": [
          {"type":"paragraph","text":"Pick the output from the job, not from a long format menu. A photo that needs to open everywhere is a different problem from a screenshot that needs a transparent background or a document that should keep its layout."},
          {"type":"heading","level":2,"text":"Start with the job"},
          {"type":"list","ordered":false,"items":["Photos and scans that should open on almost any device: JPG.","Screenshots, logos, and images that need transparency: PNG.","Pages that should keep a fixed layout: PDF.","A file the other person must edit: use the document tool that names that output, such as PDF to Word."]},
          {"type":"heading","level":2,"text":"What stays on this device"},
          {"type":"paragraph","text":"Image, PDF, font, and utility tools that run in the browser stay on this device. The file is not uploaded for those conversions. The tool page says when a dedicated worker is required instead."},
          {"type":"note","text":"Video and audio routes stay listed, but they do not convert until that worker exists. The page does not pretend the file was processed."},
          {"type":"heading","level":2,"text":"A simple choice"},
          {"type":"steps","items":[{"title":"Name the result","text":"Decide whether you need a photo, a transparent image, or a fixed document."},{"title":"Open that tool","text":"Use a route whose title matches the conversion, such as PNG to JPG or PDF to Word."},{"title":"Check the processing note","text":"Browser tools finish on this device. Worker tools say they are waiting for the dedicated converter."}]},
          {"type":"faq","items":[{"question":"Is JPG smaller than PNG?","answer":"Often, for photographs. PNG is the better choice when the image needs transparency or sharp edges, such as a screenshot or a logo."},{"question":"Will every listed format convert today?","answer":"No. Browser-ready tools run locally. Formats that need the dedicated worker stay visible and say so, but they do not convert yet."}]},
          {"type":"cta","title":"Convert a PNG photo","text":"If the file is a PNG and you need a JPG, open that workspace and keep the conversion on this device.","href":"/png-to-jpg","label":"Open PNG to JPG"}
        ]
      }$body1$::jsonb
    ),
    (
      'convert-png-to-jpg-in-the-browser',
      'tutorials',
      'Convert PNG to JPG in your browser',
      'Use the PNG to JPG tool locally. See what happens to transparency, then download the result.',
      'Convert PNG to JPG in your browser',
      'Turn a PNG into a JPG on your device. Transparency becomes a white background, and the file is not uploaded.',
      array['png-to-jpg', 'image-compressor']::text[],
      2,
      $body2${
        "version": 1,
        "blocks": [
          {"type":"paragraph","text":"PNG to JPG runs in your browser. Drop a PNG on the PNG to JPG page, leave the output on JPG, and download the result. The file is not uploaded for this conversion."},
          {"type":"heading","level":2,"text":"Convert the file"},
          {"type":"steps","items":[{"title":"Open PNG to JPG","text":"The page is prepared for PNG input and a JPG result."},{"title":"Drop the PNG","text":"Use one PNG. A different format is rejected on this route."},{"title":"Download the JPG","text":"The browser writes the JPG on this device. There is no account step."}]},
          {"type":"heading","level":2,"text":"What happens to transparency"},
          {"type":"paragraph","text":"JPG cannot store transparency. Before this tool writes a JPG, it fills the canvas with white and then draws the image. Transparent areas become white."},
          {"type":"note","text":"If you still need a transparent background, keep the PNG. Converting to JPG will not preserve a clear background."},
          {"type":"heading","level":2,"text":"When JPG is the wrong output"},
          {"type":"list","ordered":false,"items":["Logos and interface screenshots usually stay sharper as PNG.","A file you still need to edit as a document should not be flattened into a photo.","If the goal is a smaller image rather than a format change, use the image compressor."]},
          {"type":"faq","items":[{"question":"Is the PNG uploaded?","answer":"No. This browser tool converts on your device."},{"question":"Why does a transparent PNG look different as a JPG?","answer":"The converter paints a white background because JPG has no transparency channel."}]},
          {"type":"cta","title":"Open the workspace","text":"Drop the PNG and download the JPG from the matching tool.","href":"/png-to-jpg","label":"Convert PNG to JPG"}
        ]
      }$body2$::jsonb
    ),
    (
      'why-a-heic-photo-will-not-open',
      'troubleshooting',
      'Why a HEIC photo will not open',
      'iPhone photos often use HEIC. This guide explains the browser limit and the HEIC to JPG tool.',
      'Why a HEIC photo will not open',
      'HEIC photos fail when the browser cannot decode them. See the exact message and when Safari can finish the JPG locally.',
      array['heic-to-jpg']::text[],
      2,
      $body3${
        "version": 1,
        "blocks": [
          {"type":"paragraph","text":"A HEIC or HEIF photo is the usual iPhone camera format. It fails on the HEIC to JPG tool when this browser cannot decode it. The conversion still runs locally. There is no upload step and no separate worker for this route."},
          {"type":"heading","level":2,"text":"The message you will see"},
          {"type":"paragraph","text":"If the browser cannot read the photo, the tool stops with: This browser cannot decode HEIC. Try Safari, or convert the photo to JPG first. That is a decoder limit, not a failed upload."},
          {"type":"heading","level":2,"text":"What to try"},
          {"type":"steps","items":[{"title":"Confirm the file type","text":"The HEIC to JPG page accepts HEIC and HEIF only. A PNG or JPG belongs on its own tool."},{"title":"Try a browser that can decode HEIC","text":"Safari on Apple devices often can. When decoding works, the same page writes a JPG on that device."},{"title":"Do not expect a worker fallback","text":"This route does not send the photo to a server when the browser cannot decode it."}]},
          {"type":"note","text":"Changing the extension from .heic to .jpg does not convert the photo. The bytes stay HEIC, and other apps can still refuse to open the file."},
          {"type":"faq","items":[{"question":"Does every browser convert HEIC?","answer":"No. The tool can finish only when the browser itself can decode HEIC or HEIF."},{"question":"Is the photo uploaded when decoding fails?","answer":"No. The error happens while reading the file in the browser."}]},
          {"type":"cta","title":"Try HEIC to JPG","text":"Open the tool in a browser that can decode the photo, then download the JPG.","href":"/heic-to-jpg","label":"Open HEIC to JPG"}
        ]
      }$body3$::jsonb
    )
) as seed(slug, topic_slug, title, excerpt, seo_title, seo_description, tool_slugs, reading_minutes, body)
join public.blog_topics topic on topic.slug = seed.topic_slug
on conflict (slug) do update
set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  status = excluded.status,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  canonical_path = excluded.canonical_path,
  topic_id = excluded.topic_id,
  tool_slugs = excluded.tool_slugs,
  published_at = coalesce(public.blog_posts.published_at, excluded.published_at),
  noindex = excluded.noindex,
  reading_minutes = excluded.reading_minutes;
