
const express = require( "express" );
const bodyParser = require( "body-parser" );
const mongoose = require( "mongoose" );
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

//static packages setup
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


/*========================= database =========================*/
mongoose.connect("mongodb+srv://admin:test123@cluster0.exqtolb.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

const itemSchema = new mongoose.Schema ({
  name: {
    type: String,
    required: [true, "no itemName"]
  }
});

const Item = mongoose.model("Item", itemSchema);

const defaultItem1 = new Item ({
  name: "make a todolist"
});

const defaultItem2 = new Item ({
  name: "do stuff"
});

const itemList = [defaultItem1, defaultItem2];


/*======================= list database ========================*/
const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemSchema]
});
const List = mongoose.model("List", listSchema);

/*======================= ROOT GET REQUEST ========================*/
/* reads database and renders into existence using ejs*/
app.get("/", function(req, res) {

  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(itemList, function(err) {
        if (err) {
          console.log( err );
        } else {
          console.log( "successfully saved all the items to db" );
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { // rendering using all variables
         listTitle: "today",
         newListItems: foundItems
       });
    }
  })
});

/*======================= CUSTOM GET REQUEST ========================*/
/* reads database and renders into existence using ejs*/
app.get("/:customListName", function(req,res){
  const customListName = _.toLower( req.params.customListName );

  List.findOne ({name: customListName}, function (err, foundList){
    if(!err){
      // create a new list
      if(!foundList){
        console.log (customListName + " doesn't exist");

        const list = new List ({
           name : customListName,
           items: itemList
        });
        list.save();

        console.log (customListName + " was created");
        console.log ("redirecting to " + customListName);
        res.redirect("/"+ customListName);

      } else {
        console.log("custom list " + foundList.name + " found. rendering...");
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    } else {
      console.log (err);
    }

  });

});


/*======================= ROOT POST REQUEST ==========================
  every post request is handled through root
  if user is trying to post to custom list, we handle the post request at root
  to save the post data into customlist
*/
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item ({
    name: itemName
  });

  if (listName === "today"){
    newItem.save();
    console.log("item " + itemName + " is saved in default list")
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      console.log("item " + itemName + " is saved in list" + listName)
      res.redirect("/" + listName);
    });
  }


});

/*==================== ITEM DELETE POST REQUEST =======================
*/
app.post("/delete", function(req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "today") {
    Item.deleteOne(
      {_id: checkedItemId },
      function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully deleted the checked item");
          res.redirect("/");
        }
      });
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
