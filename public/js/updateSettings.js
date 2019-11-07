import axios from 'axios';
import { showAlert } from './alerts';

//TYPE IS EITHER PASSWORD OR DATA
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === `password`
        ? `http://localhost:3000/api/v1/users/updateMyPassword`
        : `http://localhost:3000/api/v1/users/updateMe`;
    const res = await axios({
      method: `PATCH`,
      url,
      data
    });
    //RELOAD PAGE IF SUCCESS
    if (res.data.status === `success`) {
      showAlert('success', `${type.toUpperCase()} updated successfully.`);
      window.setTimeout(() => {
        location.assign(`/me`);
      }, 1500);
    }
  } catch (err) {
    showAlert(`error`, err.response.data.message);
  }
};
