
//global variables here so other files can access

let garage = {
    numBikes: 0,
    bikes: [],
}

let keys = Object.keys(localStorage);

window.onload = function () {

    loadAllBikes();

    let addBikeButton = document.querySelector(".addBikeButton");
    let popWindow = document.querySelector(".bikeDetailsWindow")

    if (addBikeButton) { //just to make sure it does exist before attaching eventListener
        addBikeButton.addEventListener("click", function () {
            popWindow.style.display = "inline-block";
        });
    }

    let bikeForm = document.getElementById("bikeForm");

    if (bikeForm) { //just to make sure it does exist before attaching eventListener
        bikeForm.addEventListener("submit", function (event) {
            event.preventDefault();

            let name = document.getElementById("nameInput").value;
            let type = document.getElementById("typeInput").value;
            let color = document.getElementById("colorInput").value;

            let key = Object.keys(localStorage).length + 1;

            let bikeData = {
                bikeName: name,
                bikeType: type,
                bikeColor: color
            };

            popWindow.style.display = "none";

            localStorage.setItem(key, JSON.stringify(bikeData));


            garage.numBikes += 1;

            loadAllBikes();

        });
    };



    function loadAllBikes() {

        let keys = Object.keys(localStorage);
        keys.sort(); // used here to sort in order all the stored data in local storage

        let menu = document.querySelector(".bikes-menu");

        //only run through the render all if we have already existing bikes
        if (keys.length > 0) {

            let bikes = document.querySelectorAll(".bikeObject"); // here it prevents doubles and clears the menu before re-rendering all stored bikes
            bikes.forEach(bike => bike.remove());

            // garage.bikes = []; // empty bikes array to repush after

            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];

                let bikeDataString = localStorage.getItem(key);
                let bikeData = JSON.parse(bikeDataString);


                let newBike = new Bike(
                    bikeData.bikeName,
                    bikeData.bikeType,
                    bikeData.bikeColor
                );

                garage.bikes.push(newBike);
                newBike.renderbike(key);

            }
        }
    }

}
