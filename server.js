const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.urlencoded({extended: true}))
app.use(express.json());

app.use('/api/user', require("./routes/user"));
app.use('/api/products', require("./routes/products"));
app.use('/api/orderstatus', require("./routes/orderstatus"));
app.use('/api/transaction', require("./routes/transaction"));
app.use('/api/order', require("./routes/order"));

app.listen(3001, () =>{
    console.log("Listening on port 3001");
});