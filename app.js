const express = require("express");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST;
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();


//  for express middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


//  adding ejs
app.set('view engine', 'ejs');


//  connecting mongoose: Cluster MongoDB Atlas Account
mongoose.connect("mongodb+srv://admin-maisam:0404@cluster0.marbxco.mongodb.net/todoDatabase");

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = new mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Buy Food"
});

const item2 = new Item({
    name: "Cook Food"
  });
  
  const item3 = new Item({
      name: "Eat Food"
    });

const defaultItems = [item1, item2, item3]; // storing default items in an array.


//  creating new schema for custom lists(pages)
const listsSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listsSchema);


const day = date.getDate();


app.get("/", function(req, res)
{
//  checking the default items
  Item.find({})
  .then(foundItems=>{
      if(foundItems.length === 0){
        Item.insertMany(defaultItems)
          .then(()=>{
            console.log("Successfully inserted");
          })
          .catch(err=>{
            console.log("didn't inserted", err)
          });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: day, newListItems: foundItems});
      }
    })
    .catch(err=>{
      console.log(err);
    })
});


//  custom list building
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName); // applying a lodash property in order to have the first letter to be capital of a list
  
  List.findOne({name: customListName})
  .then(foundCustomList=>{
    if(!foundCustomList){
        const listitem1 = new List({
          name: customListName,
          items: defaultItems
        });
        listitem1.save();
        res.redirect("/" + customListName);
    } else {
        res.render("list", {listTitle: foundCustomList.name, newListItems: foundCustomList.items});
    }
  })
  .catch(err=>{
    console.log(err);
  });
});


//  adding new items to both home route as well as custom lists
app.post("/", function(req, res)
{
//  adding new items to app and db
  const itemName = req.body.newItem;
  const listName = req.body.list;

  //  new document to be added
  const upcomingItem = new Item({
    name: itemName
  });

  if(listName === day){
    upcomingItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
      .then(addItem=>{
        addItem.items.push(upcomingItem);

        addItem.save();

        res.redirect("/" + listName);
      })
      .catch(err=>{
        console.log(err);
      });
  }
});


//  for deleted or completed items both custom list and home route
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listNameForDeleting = req.body.listName;

  if(listNameForDeleting === day){
    Item.findByIdAndRemove(checkedItemId)
      .then(()=>{
        console.log("Successfully removed!");
      })
      .catch(err=>{
        console.log("Removed!", err);
      });
      res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name: listNameForDeleting}, {$pull: {items: {_id: checkedItemId}}})
      .then(()=>{
        console.log("Successfully removed!");
        res.redirect("/" + listNameForDeleting);
      })
      .catch(err=>{
        console.log("Removed!", err);
      })
  }
});


//  listening to port 
app.listen(PORT, HOST, () => {
  console.log(`server started on ${HOST}:${PORT}`);
});