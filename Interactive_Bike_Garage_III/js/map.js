document.addEventListener('DOMContentLoaded', () => { //only initialize after DOM is loaded

    const lang = "english";

    // start the PMTiles protocol
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    // Initialize the native MapLibre GL Map
    const map = new maplibregl.Map({
        container: 'map',
        style: 'assets/greybeard.json', // change to my local greybeard with source to assets/montreal.pmtiles once I have it 

        center: [-73.5773, 45.4959], //[lng, lat]
        // Concordia EV building [-73.5773, 45.4959]
        // Cycle Regis shop [-73.61242022522704, 45.523095397167324]
        // Mile end bike garage [-73.60785382171707, 45.52771341248347]
        // Cycle7 [-73.55233013686879, 45.481121101454804]

        zoom: 14,
        pitch: 45,
        bearing: 0,
        antialias: true,
        attributionControl: false
    });

    // variables for auto-rotation and can be later used to be controlled by IMU angle
    let rotationAngle = 0;
    let isRotating = true;


    map.on('load', () => {

        fetch('js/shops.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Could not load shops.geojson: ${response.status}`);
                }
                return response.json();
            })
            .then(geojson => {
                map.addSource('bike-shops', {
                    type: 'geojson',
                    data: geojson
                }); //add bike shop data

                map.addLayer({
                    id: 'bike-shops-layer',
                    type: 'circle',
                    source: 'bike-shops',
                    paint: {
                        'circle-radius': 5,
                        'circle-color': 'white',
                        'circle-stroke-width': 2,
                        'circle-stroke-color': 'black'
                    }
                });

                geojson.features.forEach(feature => {
                    if (feature.geometry?.type !== 'Point') return;

                    const properties = feature.properties || {};

                    let name = "";
                    if (lang !== "english") {
                        name = properties.fr_name;
                    }
                    else {
                        name = properties.en_name;
                    }

                    const content = document.createElement('div');
                    const title = document.createElement('strong');

                    title.textContent = name;
                    content.appendChild(title);




                    let popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, })
                        .setLngLat(feature.geometry.coordinates)
                        .setDOMContent(content)
                        .addTo(map);

                    if (properties.is_coop === true) {
                        popup.addClassName("coop-popup");
                    }
                    else {
                        popup.addClassName("shop-popup");
                    }


                });
            })
            .catch(error => console.error('Failed to load bike shop data:', error));

        // resize just to be sure and start auto rotation
        map.resize();
        rotateMap();
    });


    //Smooth slow-rotation
    function rotateMap() {
        if (isRotating) {
            rotationAngle = (rotationAngle + 0.05) % 360;
            map.setBearing(rotationAngle);
        }
        requestAnimationFrame(rotateMap);
    }

    // ways to stop the auto rotation
    map.on('mousedown', () => { isRotating = false; });
    map.on('touchstart', () => { isRotating = false; });
});