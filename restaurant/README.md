# Nocte — restaurant website concept

Nocte is a fictional four-page restaurant website created as a portfolio demonstration. The brand, menu, opening hours, prices, and reservation details are sample content.

## Pages

- `index.html` — restaurant story and primary calls to action
- `menu.html` — sample food and drinks menu with accessible tabs
- `space.html` — interior gallery
- `reserve.html` — interactive table selection and FAQ

The reservation form validates the date, time, party size, table and contact details, then stores a demo request in the visitor's browser. It **does not send a reservation** or check live availability. A client launch would require connection to the restaurant's booking system or email workflow, plus real policies, menu, hours and venue photography.

## Run locally

Open `index.html` directly, or run `py -m http.server 8000` from this folder and open `http://localhost:8000`. There is no build step or framework dependency. Italiana and DM Sans load from Google Fonts, with local serif and sans-serif fallbacks.

## Imagery

The original six local images in `assets/` depict a fictional venue. The redesign adds `nocte-editorial.webp`, a generated still life created specifically for the new home hero. None of the images are photographs of a real restaurant.

## Design references

The redesign treats Nocte as an after-dark gastronomic journal. Editorial type scale and composition were informed by [Redis Agency on Refero](https://styles.refero.design/style/4406799b-1586-4d84-aac9-e6acdee0f679); its isolated subject and restrained chrome take cues from [ORYZO on Refero](https://styles.refero.design/style/1f204e95-454a-437e-845b-c1b169d35607). The scroll image reveals were researched against the MIT-licensed [Codrops DoubleImageHoverEffects](https://github.com/codrops/DoubleImageHoverEffects) and [OnScrollColumnsRows](https://github.com/codrops/OnScrollColumnsRows). This static project implements the motion with browser APIs, so it remains dependency-free and respects reduced-motion settings.

The four pages retain the interactive menu and demo table request. `editorial.css` carries the new visual system; `styles.css` retains the original page layout and functional component styles.
