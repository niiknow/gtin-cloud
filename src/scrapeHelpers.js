// Function to create recipe from json
const Recipe = require('../../models/recipe');

module.exports.createRecipe = function(name, description, imagePath, ingredients, cookmethod, user, cooktime) {
    console.log('in create and post')
    json.name = name;
    json.description = description;
    json.imagePath = imagePath;
    json.user = user;
    json.ingredients = ingredients;
    json.cookmethod = cookmethod;
    json.cooktime = cooktime;

    let recipe = new Recipe(json);
    return recipe
};

// Function to add generated recipe to database

module.exports.postRecipe = function(recipe, res) {
    Recipe.addRecipe(recipe,
        (err, user) => {
            if (err) {
                res.json({success: false, msg: err});
                console.log(err)
            } else {
                res.json(200, [json])
            }
        })
};
