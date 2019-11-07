import axios from 'axios';
const stripe = Stripe('pk_test_fI5iiQeytwuL0QgaxPTmuO4O00lwpOqTWu');
import { showAlert } from './alerts';

export const bookTour = async tourId => {
  try {
    //1. GET CHECKOUT SESSION FROM API
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);
    //2. CREATE CHECKOUT FORM AND CHARGE CREDIT CARD
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
