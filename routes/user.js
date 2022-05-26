const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto")



const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
};

function getHash(pwd, salt){
    var hashBuffer = crypto.pbkdf2Sync(pwd,salt,10000,255,'sha512')
    var hashString = Buffer.from(hashBuffer, 'hex').toString('base64').slice(0,255)
    return hashString
}

router.post('/signup', async (req,res) => {
    const userdata = req.body
    const errors = []
    userdata.email = userdata.email?.toString() ?? ''
    userdata.first_name = userdata.first_name?.toString() ?? ''
    userdata.last_name = userdata.last_name?.toString() ?? ''
    userdata.password = userdata.password?.toString() ?? ''
    userdata.confirmpassword = userdata.confirmpassword?.toString() ?? ''
    
    if(!validateEmail(userdata.email)) errors.push("Bad Email Address")
    if(userdata.first_name.length<=0) errors.push("First Name has to be filled")
    if(userdata.last_name.length<=0) errors.push("Last Name has to be filled")
    if(userdata.telephone_number.length<=0) errors.push("Telephone number has to be filled")
    if(userdata.password.length<8) errors.push("Password must be at least 8 characters")
    if(userdata.password!==userdata.confirmpassword) errors.push("Passwords do not match")
    if(errors.length===0){
        const usercount = await prisma.customer.count({
            where: {
                email: userdata.email
            }
        })
        if(usercount !== 0){
            res.send(JSON.stringify({"status":"error", "errors":["Account with this e-mail already exists!"]}))
            return false
        }
        var salt = crypto.randomBytes(255).toString('base64');
        salt = salt.slice(0,255)
        var hash = getHash(userdata.password, salt)
        const createUser = await prisma.customer.create({
            data: {
                email: userdata.email,
                first_name: userdata.first_name,
                last_name: userdata.last_name,
                hash: hash,
                salt:salt,
                telephone_number: userdata.telephone_number
            },
        });
        console.log("Account created!");
        return false
    }
    res.send(JSON.stringify({"status":"error", errors}))
    
    
});

module.exports = router
