export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiY2FyYWxhZ3VtZW4iLCJhIjoiY2syZHVwOTg1MDJyYTNudDg1dGhuYm5vbSJ9.M9qJwdkhKLoNpo8p7s2wBg';
  var map = new mapboxgl.Map({
    container: 'map',
    style: `mapbox://styles/caralagumen/ck2dv0vb414xu1cojwfrbx57h`,
    scrollZoom: false
    // center: [-118.113491, 34.111745],
    // zoom: 8,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    //CREATE MARKER
    const el = document.createElement(`div`);
    el.className = `marker`;
    //ADD MARKER
    new mapboxgl.Marker({
      element: el,
      anchor: `bottom`
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    //ADD POPUP
    new mapboxgl.Popup({
      //RAISE POPUP
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    //EXTEND MAP BOUNDS TO INCLUDE CURRENT LOCATION
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    //ADD PADDING
    padding: { top: 200, bottom: 150, left: 100, right: 100 }
  });
};
