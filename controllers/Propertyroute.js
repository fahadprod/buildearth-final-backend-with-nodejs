require("dotenv/config");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const Property = require("../models/Property.js");
const { check, validationResult } = require("express-validator");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const bodyParser = require("body-parser");
const { url } = require("inspector");
var urlencodedParser = bodyParser.json({ extended: false });
const { requireAuth } = require("../middleware/authMiddleware");

const User = require("../models/user.js");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//GET METHOD
router.get("/getproperty", async (req, res) => {
  const pageNumber = 1;
  const PageSize = 5;
  const property = await Property.find()
    .skip((pageNumber - 1) * PageSize)
    .limit(PageSize)
    .sort();
  res.send(property);
});

router.get("/allProperty", async (req, res) => {
  try {
    const allProperty = await Property.find().sort({
      createdAt: -1,
    });
    res.send(allProperty);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get all specific properties for dealers and staff

router.get("/:id/properties", async (req, res) => {
  try {
    const userProperty = await User.findById({ _id: req.params.id }).populate(
      "properties"
    );
    res.send(userProperty);
  } catch (err) {
    res.status(500).json(err);
  }
});

// search by filters without min max price

// router.get("/filter", async (req, res) => {

//   const filters = req.query;
//   const property = await Property.find()
//     console.log(property);
//     const filteredProperty = property.filter((property) => {
//       console.log(property);
//       let isValid = true;
//       for (key in filters) {
//         console.log(key, property[key], filters[key]);
//         isValid = isValid && property[key] == filters[key];
//       }
//       return isValid;
//     });
//     res.send(filteredProperty);

// })

// second method for filter by using all value

router.get(
  "/filterProperty/:society/:name/:category/:minprice/:maxprice",
  async (req, res) => {
    try {
      const findProperty = await Property.find({
        society: req.params.society,
        name: req.params.name,
        category: req.params.category,
        price: { $gte: req.params.minprice, $lte: req.params.maxprice },
      });
      res.status(200).json(findProperty);
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

// search filter property with all value or with any one value you can filter properties

// router.post("/findProperty", async (req, res) => {
//   try {
//     let { society, name, category, minprice, maxprice } = req.query
//     let query = {}
//     if (society != null) {
//       query.society = society
//     }
//     if (name != null) {
//       query.name = name
//     }
//     if (category != null) {
//       query.category = category
//     }
//     if (minprice != null) {
//       if (query.minprice > 0) {
//         query.minprice <= price
//       }
//     }
//     if(maxprice != null){
//       if(query.maxprice > 0){
//         query.maxprice >= price
//       }
//     }
//     const result = await Property.find(query);
//     res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json(err)
//   }
// })

//Filter Search Router
// router.get("/getproperty/:society/:name/:category/:minprice/:maxprice", async (req,res)=>{
//     const pageNumber = 1;
//     const PageSize = 5;
//     try{
//         const property= await Property.find({
//             society:req.params.society,
//             name:req.params.name,
//             category:req.params.category,
//             price: {$gte:req.params.minprice, $lte:req.params.maxprice},
//         })
//         .skip((pageNumber - 1) * PageSize)
//         .limit(PageSize)
//         .sort()

//         console.log(property)
//         res.send(property)

//     } catch(err){
//     console.log(err)
//     res.status(400).json('server error')
//     }
// })

// HANDLING THE IMAGE USING S3
const s3 = new AWS.S3({
  accessKeyId: "AKIAQBXF6HVZ53WGEHWM",
  secretAccessKey: "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",
  Bucket: "buildearth-property-images",
  region: "us-east-1",
});

// POSTING A PROPERTY ROUTER
// router.post("/addproperty", multer({ dest: 'temp/', limits: { fieldSize: 8 * 1024 * 1024 } }).single('image'),
//     [
//         check('society', 'please enter the society').not().isEmpty(),
//         check('name', 'please enter the name').not().isEmpty(),
//         check('category', 'please enter the category').not().isEmpty(),
//         check('address', 'please enter the address').not().isEmpty(),
//         check('price', 'please enter the price').not().isEmpty(),
//     ]
//     ,
//     async (req,res)=>{

//         console.log(req.file);
//         let myFile = req.file.originalname.split(".")
//         const fileType = myFile[myFile.length - 1]
//         var params = {
//           ContentEncoding: "base64",
//           ContentType: req.file.mimetype,
//           Bucket: "build-earth-property-images",
//           Key: `${uuidv4()}.${fileType}`,
//           Body: fs.createReadStream(req.file.path),
//         };
//         s3.upload(params, (error, data)=>{
//             if(error){
//                 res.status(500).send(error)
//             }
//             if(data){
//                 fs.unlinkSync(req.file.path);
//                 const locationUrl = data.Location;
//                     let newProperty =  new Property(
//                         {
//                             society:req.body.society,
//                             name:req.body.name,
//                             category: req.body.category,
//                             address: req.body.address,
//                             price:req.body.price
//                         }
//                 )
//                 console.log(newProperty)
//                     newProperty = new Property({...req.body,image:locationUrl});
//                     newProperty.save().then(console.log(newProperty))
//                     var result={
//                         newProperty:newProperty
//                     }
//                     res.send(result);
//                     console.log(data);
//             }
//         })
//     }
// );

router.post("/addproperty", upload.single("file"), async (req, res) => {
  try {
    const userId = req.body.userId;
    const file = req.file;
    const params = {
      Bucket: "buildearth-property-images",
      Key: `${file.originalname}.${uuidv4()}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    s3.upload(params, async function (err, data) {
      if (err) {
        res.status(500).json({ error: true, Message: err });
      } else {
        const imagePath = data.Location;
        const property = new Property({
          society: req.body.society,
          name: req.body.name,
          category: req.body.category,
          address: req.body.address,
          price: req.body.price,
          image: imagePath,
        });
        const addProperty = await property.save();
        res.status(200).json({ addProperty });
        return User.findByIdAndUpdate(
          userId,
          { $push: { properties: addProperty._id } },
          { new: true, useFindAndModify: false }
        );
      }
    });
  } catch (err) {
    res.status(500).json(err);
    return;
  }
});

// get single property for edit

router.get("/single/:id", upload.single("file"), async (req, res) => {
  try {
    const getProperty = await Property.findById({ _id: req.params.id });
    res.send(getProperty);
  } catch (err) {
    res.status(500).json(err);
  }
});

// delete property

router.delete("/delete/:id", async (req, res) => {
  try {
    const deleteProperty = await Property.findByIdAndDelete({
      _id: req.params.id,
    });
    res.status(200).json({
      property: deleteProperty,
      message: "Property deleted Successfully! ",
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// PROPERTY UPDATE ROUTE

router.put("/update/:id", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const params = {
      Bucket: "buildearth-property-images",
      Key: `${file.originalname}.${uuidv4()}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    };
    s3.upload(params, async function (err, data) {
      if (err) {
        res.status(500).json({ error: true, Message: err });
      } else {
        console.log(data);
        const imagePath = data.Location;
        const updateProperty = await Property.findByIdAndUpdate(
          { _id: req.params.id },
          {
            society: req.body.society,
            name: req.body.name,
            category: req.body.category,
            address: req.body.address,
            price: req.body.price,
            image: imagePath,
          }
        );

        res.status(200).json({
          propertyUpdate: updateProperty,
          message: "Property Update Successfully!",
        });
      }
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATING THE PROPERTY ROUTER

// router.put("/:id", upload.single("file"), async (req, res) => {
//   AWS.config.update({
//     accessKeyId: "AKIAZDC4UDBDSU6V6XFI",
//     secretAccessKey: "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",
//     region: "us-east-1",
//   });

//   const fileStream = fs.createReadStream(req.file);
//   fileStream.on("error", function (err) {
//     if (err) {
//       throw err;
//     }
//   });

//   fileStream.on("open", function () {
//     const s3 = new AWS.S3();
//     s3.putObject(
//       {
//         Bucket: "build-earth-property-images",
//         Key: `${file.originalname}.${uuidv4()}`,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//         ACL: "public-read",
//       },
//       function (err) {
//         if (err) {
//           throw err;
//         }
//       }
//     );
//   });
//   const property = await Property.findByIdAndUpdate(
//     req.params.id,
//     {
//       society: req.body.society,
//       name: req.body.name,
//       category: req.body.category,
//       price: req.body.price,
//       image: req.body.image,
//     },

//     { new: true }
//   );
//   if (!property)
//     return res
//       .status(404)
//       .send("The property with the given ID was not found.");

//   res.send(property);
// });

// // DELETING A PROPERTY ROUTE

router.delete("/:id", async (req, res) => {
  const { slug } = req.params;
  Property.findOneAndRemove({ slug }).exec((err, data) => {
    console.log(data);
    if (err) {
      console.log(err);
      res.status(400).json({ error: "Could not Delete Category" });
    }
    const deleteParams = {
      Bucket: "buildearth-property-images",
      Key: `${data.image.key}`,
    };
    s3.deleteObject(deleteParams, function (err, data) {
      if (err) console.log("S3 DELETE ERROR DURING", err);
      else console.log("S3 DELETED DURING", data);
    });
    res.status(200).json({
      message: "Category deleted Successfully",
    });
  });
});

module.exports = router;
