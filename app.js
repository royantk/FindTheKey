const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PORT = 10427;
const Sequelize = require('sequelize');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});

// Connect to the database
const sequelize = new Sequelize("postgres://cerfeuil:ZZiTXo8g@localhost:5432/cerfeuil");

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

// Modèle de la table game
const Game = sequelize.define("game", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    playerLives: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    playerHasKey: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    playerX: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    playerY: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
});

// Modèle de la table cases
const Case = sequelize.define("case", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    x: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    y: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    boxType: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    visibleType: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    etat: {
        type: Sequelize.STRING,
        allowNull: false,
    },
});


// Relation n-n entre les tables game_player et cases
//Game.belongsToMany(Case, { through: "game_cases" });
//Case.belongsToMany(Game, { through: "game_cases" });
Case.belongsTo(Game); // A BelongsTo B
Game.hasMany(Case); // A HasMany B

// Création de la table de liaison
sequelize.sync().then(() => {
    console.log("Tables created");
});

// Route pour créer une nouvelle partie
app.post("/newgame", async (req, res) => {
    try {
        // Récupération des paramètres
        const size = req.body.size;

        // Génération aléatoire des positions de la case départ, de la clé et des ennemis
        const xDepart = Math.floor(Math.random() * size);
        const yDepart = Math.floor(Math.random() * size);
        let xKey = Math.floor(Math.random() * size);
        let yKey = Math.floor(Math.random() * size);
        while (xKey === xDepart && yKey === yDepart) {
            xKey = Math.floor(Math.random() * size);
            yKey = Math.floor(Math.random() * size);
        }
        const xEnemies = [];
        const yEnemies = [];
        for (let i = 0; i < Math.min(size - 1, 3); i++) {
            let x = Math.floor(Math.random() * size);
            let y = Math.floor(Math.random() * size);
            while ((x === xDepart && y === yDepart) || (x === xKey && y === yKey) || xEnemies.indexOf(x) !== -1 || yEnemies.indexOf(y) !== -1) {
                x = Math.floor(Math.random() * size);
                y = Math.floor(Math.random() * size);
            }
            xEnemies.push(x);
            yEnemies.push(y); // faire enemies ! [(x, y), (x, y), (x, y)]
        }

        // Création de la nouvelle partie
        const game = await Game.create({
            playerLives: 3,
            playerX: xDepart,
            playerY: yDepart,
        });

        // Création des cases
        let cases = [];
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                let boxType = "simple";
                let visibleType = "hidden";
                let etat = "hidden";
                if (x === xDepart && y === yDepart) {
                    boxType = "depart";
                    visibleType = "depart";
                    etat = "current";
                } else if (x === xKey && y === yKey) {
                    boxType = "key";
                } else if (xEnemies.indexOf(x) !== -1 && yEnemies.indexOf(y) !== -1) { // à corriger, avec (x,y), là marche si x ou y
                    boxType = "enemy";
                }
                cases.push(await Case.create({
                    x: x,
                    y: y,
                    boxType: boxType,
                    visibleType: visibleType,
                    etat: etat,
                    gameId: game.id
                }));
            }
        }

        // association des cases à la partie
        game.setCases(cases);

        // Récupération des cases sans le champ boxType
        cases = await Case.findAll({
            where: { gameId: game.id },
            attributes: { exclude: ['boxType'] }
        });

        res.json({
            success: true,
            message: "New game created successfully",
            data: {
                game: game,
                cases: cases
            }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Error creating new game",
            error: err
        });
    }
});


/* 

// Route pour gérer les déplacements du joueur
// Route pour déplacer le joueur
app.put("/move", async (req, res) => {
    try {
        // Récupération de la partie
        const game = await Game.findByPk(req.body.gameId);

        // Mise à jour de la position du joueur
        game.playerX = req.body.x;
        game.playerY = req.body.y;

        // Sauvegarde des modifications
        await game.save();

        // Récupération des cases associées à la partie
        const cases = await game.getCases();

        // Récupération de la case actuelle
        const currentCase = cases.find(
            (c) => c.x === game.playerX && c.y === game.playerY
        );

        // Mise à jour des informations sur le joueur en fonction de la case actuelle
        if (currentCase.boxType === 0) {
            game.playerLives--;
        } else if (currentCase.boxType === 1) {
            game.playerHasKey = true;
        }

        // Sauvegarde des modifications
        await game.save();
        res.status(200).json({
            game,
            currentCase,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

*/