class Bike {
    //construct the bike with base attributes
    constructor(name, type, color) {
        this.name = name;
        this.type = type;
        this.color = color;
    }


    // renders the bike as div and adds button according to bike id
    renderbike(id) {

        this.bike = document.createElement("div");
        this.bike.classList.add("bikeObject")
        this.bike.id = (id);

        this.bikeButton = document.createElement("button");
        this.bikeButton.innerHTML = `<p>${this.name}</p>`;
        this.bikeButton.style.backgroundColor = `${this.color}`;

        let menu = document.querySelector(".bikes-menu");

        menu.appendChild(this.bike);
        this.bike.appendChild(this.bikeButton);
    }
}