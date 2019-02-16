var express = require('express');
var router = express.Router();
var User = require('../models/user');
var jwt = require('jsonwebtoken');


//create Admin
router.post('/register',  function(req,res,next){
  var user = new User({
    email: req.body.email,
    password: User.hashPassword(req.body.password),
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    location: req.body.location,
    mobnumber: req.body.mobnumber,
    creation_dt: Date.now()
  });

  let promise = user.save();
  
  promise.then(function(doc){
    return res.status(201).json(doc);
  })

  promise.catch(function(err){
    return res.status(501).json({message: 'Error registering user.'})
  })
})


//Admin login
router.post('/login', function(req,res,next){
   let promise = User.findOne({email:req.body.email}).exec();

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


//Get Admin Username
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

module.exports = router;
