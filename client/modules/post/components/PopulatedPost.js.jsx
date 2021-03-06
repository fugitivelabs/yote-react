import React, { PropTypes } from 'react';
import Base from "../../../global/components/BaseComponent.js.jsx";
import { connect } from 'react-redux';
import { Link } from 'react-router';
import moment from 'moment';

// import actions
import { singleActions } from '../actions';

class PopulatedPost extends Base {
  constructor(props) {
    super(props);

  }
  componentDidMount() {
    console.log("Populated item mounting *****");
    // console.log(this.context);
    const { dispatch, params } = this.props;

    // dispatch(populatedActions.fetchAndPopulateSinglePostBySlug(params.slug))
    dispatch(singleActions.fetchAndPopulateSinglePostBySlug(params.slug))
  }

  render() {
    const { item } = this.props;
    const isEmpty = !item._id;
    const updated = !isEmpty ? moment(item.updated).calendar() : '';
    console.log("isEmpty", isEmpty);
    console.log(item);
    if(item.author && item.author.username) {
      var author = item.author.username;
    } else {
      var author = "Anonymous";
    }
    // const author = item.author.username ? item.author.username : "anonymous"
    return  (
      <div className="flex ">
        <section className="section ">
          <div className="yt-container">
            <h3> Populated Post Item </h3>
            {isEmpty
              ? (item.isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
                : <div style={{ opacity: item.isFetching ? 0.5 : 1 }}>

                  <h1> { item.title }
                    <Link className="yt-btn small u-pullRight" to={`/posts/${item.slug}/update`}> UPDATE POST </Link>
                  </h1>
                  <hr/>

                  <p><small>Updated {updated}</small></p>
                  <h4> Written by {author}</h4>
                  <p> {item.content }</p>
                </div>
            }
          </div>
        </section>
      </div>
    )
  }
}

PopulatedPost.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  // console.log("State");
  // console.log(state);
  return {
    item: store.post.single.item
  }
}

export default connect(
  mapStoreToProps
)(PopulatedPost);
