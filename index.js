class Game {
    constructor() {}
    init() {       
        createFIeld();
        placeSwardsAndHeal(levelSettings.medium);
        placeHeroAndEnemies(levelSettings.medium);

        // обработка отправки формы без использования бекенда
        var formElement = document.getElementById("options");
        formElement.addEventListener("submit", (e) => {
            e.preventDefault();
            let formData = new FormData(formElement);
            level = formData.get("settings").toLowerCase();
            formElement.classList.add("hidden");
            console.log(levelSettings[level])
            clear();
            createFIeld();
            placeSwardsAndHeal(levelSettings[level]);
            placeHeroAndEnemies(levelSettings[level]);
            
            enemy = {
                damage: levelSettings[level][0],
                health: 25
            }
        })

        // добавление функционала передвижения
        document.addEventListener("keydown", (e) => {
            switch(e.key) {
                case "d":
                    enemyAttack();
                    move("right", document.querySelector(".tileP"), "tileP");
                    if (hasMoved) {
                        moveEnemies();
                    }
                    break;
                case "a":
                    enemyAttack();
                    move("left", document.querySelector(".tileP"), "tileP");
                    if (hasMoved) {
                        moveEnemies();
                    }
                    break;
                case "w":
                    enemyAttack();
                    move("up", document.querySelector(".tileP"), "tileP");
                    if (hasMoved) {
                        moveEnemies();
                    }
                    break;
                case "s":
                    enemyAttack();
                    move("down", document.querySelector(".tileP"), "tileP");
                    if (hasMoved) {
                        moveEnemies();
                    }
                    break;
                case " ":
                    enemyAttack();
                    heroAttack();
                    break;
            }
        })
    }
}

var roomsSize;
var roomsQty;
    
var emptyFields = [];
var graph = {};
    
var level;
    // настройки в зависимости от уровня сложности, выбранного пользователем. По дефолту действуют настройки среднего уровня сложности
var levelSettings = {
    "easy": [1, 5, 10, 5], // enemy damage, qty enemies, qty heal, qty swards
    "medium": [5, 10, 10, 2],
    "hard": [10, 15, 7, 2]
}


// Игровое поле массив
// 1 - стена,  0 - пустое пространство
var playField = []
for (let i = 0; i < 24; i++) {
    playField.push(Array(40).fill(1))
}

function clear() {
    document.querySelector(".field").replaceChildren();
    playField = [];
    for (let i = 0; i < 24; i++) {
        playField.push(Array(40).fill(1))
    }
    emptyFields = [];
    graph = {};
}

// Функция для создания комнат 
function createRooms() {
    roomsQty = Math.floor(Math.random() * 6 + 5); // Количество комнат от 5 до 10
    roomsSize = [];
    for (let i = 0; i < roomsQty; i++) {
        let yAcsisSize = Math.floor(Math.random() * 6 + 3); // Размер комнаты от 3 до 8
        let xAcsisSize = Math.floor(Math.random() * 6 + 3); // Размер комнаты от 3 до 8
        roomsSize.push([yAcsisSize, xAcsisSize]);
    }
}

// Функция для добавления комнат на карту
function addRooms() {
    createRooms();
    // размер карты 24 на 40, необходимо найти стартовый индекс комнаты, после чего развернуть ее вправо вниз относительно данного индекса 
    for (let i = 0; i<roomsSize.length; i++) {
        let currentRoomSize = roomsSize[i];
        let startY = Math.floor(Math.random() * (24 - currentRoomSize[0]));
        let startX = Math.floor(Math.random() * (40 - currentRoomSize[1]));
        for (let index = startY; index < startY + currentRoomSize[0]; index ++) {
            for (let a = startX; a < startX + currentRoomSize[1]; a++) {
                playField[index][a] = 0;
            }
        }
    }
}

function createPass() {
    // Определяем количество вертикальных и горизонтальных проходов
    let vertPassQty = Math.floor(Math.random() * 3 + 3); // от 3 до 5
    let horPassQty = Math.floor(Math.random() * 3 + 3); // от 3 до 5
    for (let i = 0; i < vertPassQty; i++) {
        let x = Math.floor(Math.random() * 40);
        for (let j = 0; j < playField.length; j++) {
            playField[j][x] = 0;
        }
    }
    for (let i = 0; i < horPassQty; i++) {
        let y = Math.floor(Math.random() * 24);
        for (let j = 0; j < playField[y].length; j++) {
            playField[y][j] = 0;
        }
    }
}

//// Далее идет структура проверки на доступность всех полей на поле с использованием графа
function addFieldGraph() {
    function fromIdToAcsis(id) {
        let x = id % 40;
        let y = Math.floor(id / 40);
        return [x, y];
    };
    for (let i = 0; i < playField.length; i++) {
        for (let j = 0; j < playField[i].length; j++) {
            if (playField[i][j] === 0) {
                emptyFields.push([i, j]);
                let fieldId = 40 * i + j;
                graph[fieldId] = [];
                let fieldUpId = fieldId - 40;
                let fieldDownId = fieldId + 40;
                let fieldRightId;
                let fieldLeftId;
                if (fieldId % 40 != 39) {
                    fieldRightId = fieldId + 1;
                } else {fieldRightId = 1000}
                if (fieldId % 40 != 0) {
                    fieldLeftId = fieldId - 1;
                } else {fieldLeftId = 1000}
                let arrToAdd = [fieldUpId, fieldDownId, fieldRightId, fieldLeftId];
                for (let index = 0; index < 4; index++) {
                    let coordinates = fromIdToAcsis(arrToAdd[index]);
                    if (arrToAdd[index] >= 0 && arrToAdd[index] <= 959 && playField[coordinates[1]][coordinates[0]] === 0) {
                        graph[fieldId].push(arrToAdd[index])
                    }
                }
            }
        }
    }
}

// обход графа пустых полей вширину для проверки доступности всех элементов
function bfs(graph, start) {
    let queue = [start];
    let visited = new Set();
    let result = [];

    while(queue.length) {
        let vertex = queue.shift();
        
        if (!visited.has(vertex)) {
            visited.add(vertex);
            result.push(vertex);
            
            for (let neighbor of graph[vertex]) {
                queue.push(neighbor);
            }
        }
    }

    if (result.length === emptyFields.length) {
        return true;
    } else {
        return false;
    }
}

// Добавление на страницу элементов карты с раскраской
function createFIeld() {  
    // данный блок while отвечает за обход графа пустых полей вширину и недопущения недостижимых полей на карте
    let isFieldValid = false;
    while (!isFieldValid) {
        emptyFields = [];
        graph = {};
        addRooms();
        createPass();
        addFieldGraph();
        let firstId = 40 * emptyFields[0][0] + emptyFields[0][1];
        isFieldValid = bfs(graph, firstId);
    }
    let field = document.querySelector(".field");
    for (let i = 0; i < playField.length; i++) {
        for (let j = 0; j < playField[i].length; j++) {
            let tile = document.createElement("div");
            if (playField[i][j] === 0) {
                tile.classList.add("tile");
                tile.setAttribute("id", (i*40+j).toString());
                field.appendChild(tile);
            } else {
                tile.classList.add("tileW");
                tile.setAttribute("id", (i*40+j).toString());
                field.appendChild(tile);
            }
        }
    }
}

// Получение случайного поля из списка пустых полей
function getRandomFreeField() {
    let index = Math.floor(Math.random() * emptyFields.length);
    let position = emptyFields[index];
    emptyFields.splice(index, 1);
    let divId = position[0]*40 + position[1];
    let field = document.getElementById(divId.toString());
    return field;
}
// Добавление на страницу мечей и зелий
function placeSwardsAndHeal(settings) {
    for (let i = 0; i < settings[3]; i++) {
        let field = getRandomFreeField();
        field.classList.remove("tile");
        field.classList.add("tileSW")
    }
    for (let i = 0; i < settings[2]; i++) {
        let field = getRandomFreeField();
        field.classList.remove("tile");
        field.classList.add("tileHP")
    }
}

// Добавление на страницу героя и врагов
function placeHeroAndEnemies(settings) {
    function setup(strClass) {
        let field = getRandomFreeField();
        field.classList.remove("tile");
        field.classList.add(strClass);
        let hp = document.createElement("div");
        hp.style.width = "25px";
        hp.classList.add("health")
        field.appendChild(hp)
    }
    setup("tileP")
    for (let i = 0; i < settings[1]; i++) {
        setup("tileE")
    }
}

// Реализуем логику игры:
var hero = {
    damage: 10,
    inventory: [],
    health: 25
}

var enemy = {
    damage: levelSettings.medium[0],
    health: 25
}
// Получение полей соседних с текущим полем по id
function getFieldsNearby(fieldId) {
    let fieldRight;
    if (fieldId % 40 != 39) {
        fieldRight = document.getElementById((fieldId + 1).toString());
    }
    let fieldLeft;
    if (fieldId % 40 != 0) {
        fieldLeft = document.getElementById((fieldId - 1).toString());
    }
    let fieldUp = document.getElementById((fieldId - 40).toString());
    let fieldDown = document.getElementById((fieldId + 40).toString());
    fields = [fieldRight, fieldLeft, fieldUp, fieldDown];
    return fields;
}

// атака противников
function enemyAttack() {
    let fieldsEnemies = document.querySelectorAll(".tileE");
    for (let i = 0; i < fieldsEnemies.length; i++) {
        let fieldId = parseInt(fieldsEnemies[i].id);
        let fieldsNearby = getFieldsNearby(fieldId);
        for (let index = 0; index < fieldsNearby.length; index++) {
            if (fieldsNearby[index] && fieldsNearby[index].classList[0] === "tileP") {
                console.log(fieldsNearby[index])
                let damage = enemy.damage;
                let currentHeroHealth = hero.health;
                let newHp = currentHeroHealth - damage;
                hero.health = newHp;
                console.log(hero.health);
                let heroField = document.querySelector(".tileP");
                if (newHp <= 0) {
                    heroField.replaceChildren();
                    heroField.classList.remove("tileP");
                    heroField.classList.add("tile");
                    alert("You lost! Refresh page to try again");
                } else {
                    heroField.children[0].style.width = `${newHp}px`
                }
            }
        }
    }
}

// передвижение противников: реализовано в случайном направлении
function moveEnemies() {
    let directions = ["left", "right", "up", "down"]
    let fields = document.querySelectorAll(".tileE");
    if (fields == []) {
        alert("You win! Refresh page to try again!")
    }
    for (let i = 0; i < fields.length; i++) {
        let randomDirection = directions[Math.floor(Math.random() * 4)];
        move(randomDirection, fields[i], "tileE")
    }
}

// добавление предмета в инвентарь
function addItemToInventory(item) {
    let field = document.querySelector(".inventory");
    let newItem = document.createElement("div");
    newItem.classList.add(item);
    field.appendChild(newItem);
}

var hasMoved = false;

// функция для передвижения, используется также для передвижения противников
function move(direction, field, warrior_class) {
    hasMoved = false;
    let id = parseInt(field.id);
    let hp = field.children[0];
    switch (direction) {
        case "right":
            if((id + 1) % 40 === 0) {
                console.log("End of the map!")
                return
            }
            var new_field = document.getElementById((id+1).toString());
            break;
        case "left":
            if(id % 40 === 0) {
                console.log("End of the map!")
                return
            }
            var new_field = document.getElementById((id-1).toString());
            break;
        case "up":
            if(Math.floor(id / 40) === 0) {
                console.log("End of the map!")
                return
            }
            var new_field = document.getElementById((id-40).toString());
            break;
        case "down":
            if(Math.floor(id / 40) === 23) {
                console.log("End of the map!")
                return
            }
            var new_field = document.getElementById((id+40).toString());
            break;
    }
    if (new_field.classList[0] === "tileW" || new_field.classList[0] === "tileE" || new_field.classList[0] === "tileP") {
        console.log('Can`t move in this direction')
    } else {
        if (new_field.classList[0] === "tileHP" && warrior_class === "tileP") {
            hero.inventory.push("heal");
            hero.health = 25;
            hp.style.width = "25px";
            new_field.classList.remove("tileHP");
            addItemToInventory("tileHP")
        } 
        if (new_field.classList[0] === "tileSW" && warrior_class === "tileP") {
            hero.inventory.push("swoard");
            hero.damage += 10;
            new_field.classList.remove("tileSW");
            addItemToInventory("tileSW")
        } 
        if ((new_field.classList[0] === "tileSW" && warrior_class === "tileE") || (new_field.classList[0] === "tileHP" && warrior_class === "tileE")) {
            console.log('Can`t move in this direction')
            return
        }
        field.classList.remove(warrior_class);
        field.classList.add("tile");
        new_field.classList.remove("tile");
        new_field.classList.add(warrior_class);
        new_field.appendChild(hp)
        hasMoved = true;
    }
}

// атака героем
function heroAttack() {
    let damage = hero.damage;
    let enemiesNearby = [];
    let heroField = document.querySelector(".tileP");
    let heroFieldId = parseInt(heroField.id);
    let fields = getFieldsNearby(heroFieldId)
    for (let i = 0; i < fields.length; i++) {
        if (fields[i] && fields[i].classList[0] === "tileE") {
            enemiesNearby.push(fields[i]);
        }
    }
    for (let i = 0; i < enemiesNearby.length; i++) {
        let currentHp = enemiesNearby[i].children[0].style.width.replace(/\D/g, '');
        console.log(currentHp);
        let newHp = currentHp - damage;
        console.log(newHp)
        if (newHp <= 0) {
            enemiesNearby[i].replaceChildren();
            enemiesNearby[i].classList.remove("tileE");
            enemiesNearby[i].classList.add("tile")
        } else {
            enemiesNearby[i].children[0].style.width = `${newHp}px`
        }
    }
}



