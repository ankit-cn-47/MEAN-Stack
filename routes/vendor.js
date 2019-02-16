var express = require('express');
var router = express.Router();
var Vendor = require('../models/vendor');
var jwt = require('jsonwebtoken');
var nodemailer = require("nodemailer");
var ordertime=0;


//Register Vendor
router.post('/register',  function(req,res,next){
  var vendor = new Vendor({
    name: req.body.name,
    title: req.body.title,
    fssai: req.body.fssai,
    url: req.body.url,
    email: req.body.email,
    password: Vendor.hashPassword(req.body.password),
    creation_dt: Date.now()
  });

  let promise = vendor.save();
  
  promise.then(function(doc){
    return res.status(201).json(doc);
  })

  promise.catch(function(err){
    return res.status(501).json({message: 'Error registering vendor.'})
  })
})

//Login Vendor
router.post('/login', function(req,res,next){
   let promise = Vendor.findOne({email:req.body.email}).exec();
    console.log(promise);
   promise.then(function(doc){
    if(doc) {
      if(doc.isValid(req.body.password)){
          // generate token
          let token = jwt.sign({email:doc.email},'secret', {expiresIn : '3h'});

          return res.status(200).json(token);

      } else {
        return res.status(501).json({message:' Invalid Credentials'});
      }
    }
    else {
      return res.status(501).json({message:'User email is not registered.'})
    }
   });

   promise.catch(function(err){
     return res.status(501).json({message:'Some internal error'});
   })
})

//Get Vendor Username
router.get('/username', verifyToken, function(req,res,next){
  return res.status(200).json(decodedToken.email);
})


var decodedToken='';
function verifyToken(req,res,next){
  let token = req.query.token;

  jwt.verify(token,'secret', function(err, tokendata){
    if(err){
      return res.status(400).json({message:' Unauthorized request'});
    }
    if(tokendata){
      decodedToken = tokendata;
      next();
    }
  })
}

//Get List of vendors
router.route('/vendors').get((req, res) => {
    Vendor.find((err, vendors) => {
        if (err)
            console.log(err);
        else
            res.json(vendors);
    });
});

//Delete a Vendor
router.route('/delete/:id').delete((req, res) => {
    Vendor.findByIdAndRemove(req.params.id, (err, vendor) => {
        if (err)
            res.json(err);
        else
            res.json(vendor);
    });
});

//Edit an item
router.route('/edititem/:name/:id').get(function (req, res) {
  let id = req.params.id;let A=new Array();let name = req.params.name;
  Vendor.findOne({email:name},{"items":id}, function(err, vendor){
    for(let i=0;i<vendor.items.length;i++){
      if(vendor.items[i]._id==id){
        A=vendor.items[i];
      }
    }
    res.json(A);
    }
  )
});

//Accept the vendor
router.route('/acceptVendor/:id').post(function (req, res) {
  Vendor.findById(req.params.id, function(err, vendor) {
  if (!vendor)
    return next(new Error('Could not load Document'));
  else {
      vendor.acceptStatus = req.body.acceptStatus;
      vendor.save().then(vendor => {
        res.json('Update complete');
    })
    .catch(err => {
          res.status(400).send("unable to update the database");
    });
  }
});
});

//Add Item to the vendor menu
router.route('/addItemVendor/:email').post(function (req, res) {
  Vendor.findOne({email:req.params.email}).then(function(vendor) {
  if (!vendor)
    return next(new Error('Could not load Document'));
  else {
      vendor.items.push({ itemname: req.body.itemname,
        itemdesc:  req.body.itemdesc,
        itemimgurl: req.body.itemimgurl,
        itemprice: req.body.itemprice,
        itempreptime: req.body.itempreptime })
      vendor.save().then(vendor => {
        res.json(vendor);
    })
    .catch(err => {
          res.status(400).send("unable to update the database");
    });
  }
});
});

//Update an item in vendor menu
router.route('/updateitem/:name/:id').post(function (req, res) {
  Vendor.findOne({email:req.params.name}, function(err, vendor) {
  if (!vendor)
    console.log("could not update");
  else {
      var subDoc = vendor.items.id({_id:req.params.id});
      subDoc.set({itemname: req.body.itemname,
        itemdesc:  req.body.itemdesc,
        itemimgurl: req.body.itemimgurl,
        itemprice: req.body.itemprice,
        itempreptime: req.body.itempreptime}) 
      vendor.save().then(vendor => {
        res.json(vendor);
    })
    .catch(err => {
          res.status(400).send("unable to update the database");
    });
  }
});
});

//Delete an item in vendor menu
router.route('/deleteitem/:name/:id').get(function (req, res) {
  Vendor.update({email:req.params.name},{$pull:{items:{_id:req.params.id}}}, function(err, items){
      if(err) res.json(err);
      else res.json(items);
  });
});

//get vendor specific list of items for vendordashboard
router.route('/getVendorItem/:name').get(function (req, res) {
  let name = req.params.name;
  Vendor.findOne({email:name}, function(err, vendor){
    
    res.json(vendor.items);
    }
  )
});

//get vendor spicific list of items for menu
router.get('/menu/:id', async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return res.status(404).send('Could not find the vendor.');
  res.json(vendor.items);
});

//create orders for a specific vendor
router.post('/order/:id', async (req, res) => {
  let vendor = await Vendor.findById(req.params.id);
  if (!vendor) return res.status(404).send('Could not find the vendor.');

  let order = req.body;
  let time = 0;let temp = 0;
  for(let i = 0; i < order.tray.length; i++) {
    temp= order.tray[i].itempreptime;
    if(temp>time){
      time=temp
    }
  }
  order.time = time;
  vendor.orders.push(order);
  vendor = vendor.save();
  res.json(time);
  ordertime=time;
  time=0;
});

//send email on order confirmation
router.post("/sendEmail/:name", (req,res) => {
  let name = req.body;let email=req.params.name;
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
           user: '',
           pass: ''
       }
   });
   const mailOptions = {
    from: '', // sender address
    to: email, // list of receivers
    subject: 'Order Confirmation', // Subject line
    html: `<p>Hi ${email},</br>Your order will be prepared in ${ordertime} minutes</p>`// plain text body
  };
  transporter.sendMail(mailOptions, function (err, info) {
    if(err)
      console.log(err)
    else
      console.log(info);
  });

});

//find orders for a specific vendor
router.route('/orders/:name').get(function (req, res) {
  let name = req.params.name;
  Vendor.findOne({email:name}, function(err, vendor){
    
    res.json(vendor.orders);
    }
  )
});

module.exports = router;