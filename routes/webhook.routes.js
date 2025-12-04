const express = require("express");
const { stripe } = require("../config/stripe"); 
const Order = require("../models/Order");

const router = express.Router();

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata.orderId;

      console.log("Payment successful for order:", orderId);

      await Order.findByIdAndUpdate(orderId, {
        status: "Confirmed",
      });

      console.log("Order status updated");
    }

    return res.status(200).json({ received: true });
  }
);

module.exports = router;