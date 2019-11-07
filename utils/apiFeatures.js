class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1. FILTERING
    const queryObj = { ...this.queryString }; //SHALLOW COPY
    const excludedFields = [`page`, `sort`, `limit`, `fields`];
    excludedFields.forEach(el => delete queryObj[el]); //REMOVES SORTING FROM QUERY

    // console.log(req.query, queryObj);
    //2. ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // console.log(JSON.parse(queryStr));
    //{ difficulty: `easy`, duration: { $gte: 5 } }
    //{ difficulty: `easy`, duration: { gte: '5' } }
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    //3.SORTING
    if (this.queryString.sort) {
      //?sort=-price,ratingsAverage
      const sortBy = this.queryString.sort.split(`,`).join(` `);
      // console.log(sortBy);
      this.query = this.query.sort(sortBy);
      //sort(`price ratingsAverage)
    } else {
      this.query = this.query.sort(`-createdAt`);
    }

    return this;
  }

  limitFields() {
    //4. FIELD LIMITING
    if (this.queryString.fields) {
      //?fields=name,price
      const fields = this.queryString.fields.split(`,`).join(` `);
      this.query = this.query.select(fields); //(`name duration price`)
    } else {
      this.query = this.query.select(`-__v`); //RETURNS ALL FIELDS AND EXCLUDES ONLY __v
    }
    return this;
  }

  paginate() {
    //5. PAGINATION
    const page = this.queryString.page * 1 || 1; //CONVERT STRING TO NUMBER
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit; //NUMBER OF DOCUMENTS TO BE SKIPPED

    this.query = this.query.skip(skip).limit(limit);
    // query = query.skip(2).limit(10); //page=2&limit=10

    return this;
  }
}

module.exports = APIFeatures;
