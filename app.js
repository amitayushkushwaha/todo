//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const app = express();
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const mongoose = require("mongoose");
const _ = require("lodash");
// mongodb://127.0.0.1:27017
main().catch((err) => console.log(err));
async function main() {
  try {
    mongoose.connect(
      process.env.LINK,
      {
        serverSelectionTimeoutMS: 5000, // if takes more then 5sec in connection then cancel it
      }
    );
  } catch (error) {
    console.log("there is an error in connection", error);
  }
}
const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit the + button to add a new item",
});
const item3 = new Item({
  name: "<--Hit this to delete an item",
});
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  // const day = date.getDate();
  Item.find()
    .then((items) => {
      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Successfully inserted");
          })
          .catch((err) => {
            if (err) {
              console.log(err);
            }
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }).then((foundList) => {
    if (!foundList && customListName != "favicon.ico") {
      // create new list
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  if (listName === "Today") {
    if (itemName.length > 0) {
      const newItem = new Item({
        name: itemName,
      });
      newItem.save().catch((err) => {
        if (err) {
          console.log(err);
        }
      });
    }

    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      if (itemName.length > 0) {
        const newItem = new Item({
          name: itemName,
        });
        foundList.items.push(newItem);
        foundList.save();
      }
      res.redirect("/" + listName);
    });
  }
});
app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log("successfully deleted");
      })
      .catch((err) => {
        console.log(err);
      });
    res.redirect("/");
  } else {
    // mongoose delete document from array
    // mongodb pull and pullAll.
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then((foundList) => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.listen(3000|| process.env.PORT, function () {
  console.log("Server started on port 3000");// edar ab kya krun git add 
});
