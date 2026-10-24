# Nocte — restaurant website concept

Nocte is a fictional four-page restaurant website created as a portfolio demonstration. The brand, menu, opening hours, prices, and reservation details are sample content.

## Pages

- `index.html` — restaurant story and primary calls to action
- `menu.html` — sample food and drinks menu with accessible tabs
- `space.html` — interior gallery
- `reserve.html` — interactive table selection and FAQ

The reservation form validates the date, time, party size, table and contact details, then stores a demo request in the visitor's browser. It **does not send a reservation** or check live availability. A client launch would require connection to the restaurant's booking system or email workflow, plus real policies, menu, hours and venue photography.

## Run locally

Open `index.html` directly, or run `py -m http.server 8000` from this folder and open `http://localhost:8000`. There is no build step or framework dependency. The Switzer font loads from Fontshare and falls back to Arial when offline.

## Imagery

The six local images in `assets/` were generated for this concept. They depict a fictional venue and are not photographs of a real restaurant.

## Design references

The art direction was informed by dark restaurant and café references on [Refero](https://styles.refero.design/?q=restaurant). [Lenis](https://github.com/darkroomengineering/lenis), [Swup](https://github.com/swup/swup), [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe), [Swiper](https://github.com/nolimits4web/swiper), and [Three.js](https://github.com/mrdoob/three.js) were evaluated as open-source interaction references. This demo implements its transitions, gallery and table map with native browser APIs so the four pages also run without a build process.
