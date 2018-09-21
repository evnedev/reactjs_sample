import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import VisibilitySensor from 'react-visibility-sensor';

// Import Components
import { Header, Loader, Divider, Checkbox } from 'semantic-ui-react';
import ReviewFilters from './ReviewFilters/ReviewFilters';
import ReviewListItem from './ReviewListItem/ReviewListItem';

// Import Actions
import { 
  clearReviewsArray, 
  moreReviewsByScraps, 
  changeSortOrder, 
  changeLocationVisibility, 
  changeScrapVisibility,
  REVIEWS_FETCH_LIMIT,
} from '../LocationActions';

// Import Selectors
import { 
  getSourcesIndexed, 
  getUserLocations,
} from '../../App/AppReducer';
import { 
  getFilters, 
  getScrapsByIds, 
  getReviewsArray, 
  getReviewsArrayLength, 
  getShowLoadmoreSpinner, 
} from '../LocationReducer';

const EMPTY_ARRAY = [];


class ReviewList extends Component {

  constructor(props) {
    super(props);

    this.state = { 
      renderReviewList: false,
    };

    this.handleSawLastReview = this.handleSawLastReview.bind(this);
    this.handleChangeVisibilitySensor = this.handleChangeVisibilitySensor.bind(this);
    this.handleChangeSortOrder = this.handleChangeSortOrder.bind(this);
    this.handleToggleLocationVisibility = this.handleToggleLocationVisibility.bind(this);
    this.handleToggleScrapVisibility = this.handleToggleScrapVisibility.bind(this);
    this.renderReviewListItemComp = this.renderReviewListItemComp.bind(this);
  }

  componentWillMount = () => {
    const { renderReviewList } = this.state;
    if (!renderReviewList) {
      const waitTillRenderMs = this.props.waitTillRenderMs ? this.props.waitTillRenderMs : 300;
      setTimeout(() => {
        this.setState({ renderReviewList: true });
      }, waitTillRenderMs);
    }
  }

  handleSawLastReview = (await_clear = false) => {
    if (!await_clear) {
      this.props.dispatch(moreReviewsByScraps());
    } else {
      this.props.dispatch(clearReviewsArray())
        .then(result => {
          this.props.dispatch(moreReviewsByScraps(undefined,undefined,false,true));
        });
    }
  }

  handleChangeVisibilitySensor = (isVisible) => {
    if ( isVisible && this.state.renderReviewList && this.props.user_reviews_array_length > 0 ){
      this.handleSawLastReview();
    }
  }

  handleChangeSortOrder = (value) => {
    this.props.dispatch(changeSortOrder(value));
    this.handleSawLastReview(true);
  }

  handleToggleLocationVisibility = (location_id) => {
    this.props.dispatch(changeLocationVisibility(location_id));
    this.handleSawLastReview(true);
  }

  handleToggleScrapVisibility = (scrap_id) => {
    this.props.dispatch(changeScrapVisibility(scrap_id));
    this.handleSawLastReview(true);
  }

  renderReviewListItemComp = (reviewObj) => {
    return (
      <ReviewListItem
        reviewObj={reviewObj}
        indexedScraps={this.props.indexedScraps}
        indexedSources={this.props.indexedSources}
        user_subscription_full={this.props.user_subscription_full}
        key={reviewObj._id}
        />
    );
  }


  render() {

    const {
      renderReviewList,
    } = this.state;

    const {
      user_locations,
      indexedScraps,
      indexedSources,
      filters,
      user_reviews_array,
      user_reviews_array_length,
      user_subscription_active,
      user_subscription_full,
      show_loadmore_spinner,
    } = this.props;

    const displayReviewList = user_reviews_array && user_reviews_array_length > 0;

    const _user_reviews_array = (displayReviewList) ? [...user_reviews_array] : EMPTY_ARRAY;
    const user_reviews_array_first_N = (displayReviewList) ? _user_reviews_array.splice(0, REVIEWS_FETCH_LIMIT) : EMPTY_ARRAY;

    return (
      <div>
        <ReviewFilters
          locations={user_locations}
          indexedScraps={indexedScraps}
          indexedSources={indexedSources}
          filters={filters}
          changeSortOrder={this.handleChangeSortOrder}
          toggleLocationVisibility={this.handleToggleLocationVisibility}
          toggleScrapVisibility={this.handleToggleScrapVisibility}
          />
        <Divider horizontal>Reviews</Divider>
        <div key="reviews_list_wrapper">
        { displayReviewList &&
          user_reviews_array_first_N.map(this.renderReviewListItemComp)
        }
        { renderReviewList && displayReviewList &&
          _user_reviews_array.map(this.renderReviewListItemComp)
        }
        </div>
        { show_loadmore_spinner && user_locations.length > 0 && 
          <VisibilitySensor 
            onChange={this.handleChangeVisibilitySensor}
            partialVisibility={true}
            >
            <Loader active inline='centered'/>
          </VisibilitySensor>
        }
        { (!show_loadmore_spinner || !user_locations.length) && 
          <Header 
            content='No reviews to show'
            color='teal'
            />
        }
      </div>
    );

  };

}

// Retrieve data from store as props
function mapStateToProps(state) {
  return {
    indexedSources : getSourcesIndexed(state),

    user_locations : getUserLocations(state),
    indexedScraps : getScrapsByIds(state),
    filters : getFilters(state),
    user_reviews_array : getReviewsArray(state),
    user_reviews_array_length : getReviewsArrayLength(state),
    show_loadmore_spinner : getShowLoadmoreSpinner(state),
  };
}

ReviewList.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

export default connect(mapStateToProps)(ReviewList);
