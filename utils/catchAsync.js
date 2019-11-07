//LIKE TEMPLATE FOR ERROR HANDLING - TO BE PLUGGED INTO AND ASSIGNED INTO AN ACTUAL FUNCTION
//NO MORE TRY AND CATCH
module.exports = fn => {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    }
  };