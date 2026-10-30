# Dealer studio assets

The three requested icon sources reuse repository SVG originals without another icon library.

| Source | Original repository assets | Studio use |
| --- | --- | --- |
| AutoScout24 | `public/icons/dealer-profile/car-sale-as24.svg`, `person-as24.svg` | Vehicle selection, dealer branding |
| ChoTot | `public/icons/chotot/chotot-common-video-play.svg`, `chotot-common-image.svg`, `chotot-common-info.svg`, `chotot-listing-register-image-upload-color-change.svg`, `chotot-listing-register-image-upload-delete.svg` | Video, photos, help, upload, delete |
| Reddit | `public/icons/dealer-profile/pin-reddit.svg` | Pin/save draft |

CSS masks inherit the current UI color while preserving the original SVG geometry.
Text arrows, play/pause and close controls use ordinary text, not unrelated icon libraries.

Sample vehicle photographs and identities come from existing `seoul-autogallery-v01.ts` data.
Run `node scripts/build-dealer-studio-inventory.mjs` to regenerate the sample library.
Estimated prices are excluded; a dealer must enter and confirm the actual price.
Vehicle photographs are contained inside the frame without cropping or generative alteration.

MP4 output reuses the repository's licensed `public/shortform/vendor/mp4-muxer.js`.
Pretendard uses the existing font and its OFL license. Built-in instrumental tones are
synthesized locally; optional uploaded music and narration remain on the device.
