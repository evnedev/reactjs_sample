import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { countLocationBuzzerScore } from '../../../../util/helper';

// Import Components
import { Checkbox, Dropdown, Grid } from 'semantic-ui-react';
import ReviewFilterCheckboxLocation from './ReviewFilterCheckboxLocation';
import ReviewFilterCheckboxScrap from './ReviewFilterCheckboxScrap';

const sortOptions = [
  { key: '0', value: 'created_desc', text: 'Newest' },
  { key: '1', value: 'created_asc', text: 'Oldest' },
  { key: '2', value: 'rating_desc', text: 'Highest score' },
  { key: '3', value: 'rating_asc', text: 'Lowest score' },
];

class ReviewFilters extends Component {

  handleChangeSortOrder = (e, { value }) => {
    if ( value !== this.props.filters.sort_order ){
      this.props.changeSortOrder(value);
    }
  }

  handleToggleLocationVisibility = (location_id) => {
    this.props.toggleLocationVisibility(location_id);
  }

  handleToggleScrapVisibility = (scrap_id) => {
    this.props.toggleScrapVisibility(scrap_id);
  }

  render() {

    const { props } = this;

    if ( !props.indexedScraps ){
      return null;
    }

    return (
      <div>
        <div>
          <Dropdown
            options={sortOptions}
            placeholder='sortOptions'
            selection
            value={props.filters.sort_order}
            onChange={this.handleChangeSortOrder}
          />
        </div>
        {
          props.locations.map((locationObj,index) => {
            let scraps_rating_sum = 0;
            let scraps_count = 0;
            let location_stored_review_count = 0;
            const location_scraps = [];
            locationObj.scraps.forEach(s => {
              const scrap = props.indexedScraps[s];
              if ( scrap ){
                location_stored_review_count += scrap.stored_review_count;
                if ( scrap.stored_review_count > 0 ) {
                  scraps_rating_sum += scrap.average_rating_100;
                  scraps_count++;
                }
                location_scraps.push({
                  _id:  s,
                  name: (props.indexedSources[scrap.source]) ? props.indexedSources[scrap.source].name : null,
                  average_rating: scrap.average_rating,
                  stored_review_count: scrap.stored_review_count,
                });
              }
            });
            const location_buzzer_score = countLocationBuzzerScore(scraps_rating_sum,scraps_count);
            return (
              <div key={index}>
              <div>
                <ReviewFilterCheckboxLocation 
                  locationObj={locationObj} 
                  locationBuzzerScore={location_buzzer_score} 
                  locationStoredReviewCount={location_stored_review_count} 
                  filterState={props.filters.locations[locationObj._id]} 
                  toggleLocationVisibility={this.handleToggleLocationVisibility}
                  />
              </div>
              <div hidden={!props.filters.locations[locationObj._id]}>
              <Grid >
                <Grid.Row>
                  { 
                    location_scraps.map((scrap,s_index) => {
                      if ( scrap.name === null ) return null;
                      return (
                      <Grid.Column mobile={8} computer={4} key={s_index}>
                      <ReviewFilterCheckboxScrap 
                        scrap={scrap} 
                        filterState={props.filters.scraps[scrap._id]} 
                        toggleScrapVisibility={this.handleToggleScrapVisibility}
                        />
                      </Grid.Column>
                      )
                    })
                  }
                </Grid.Row>
              </Grid>
              </div>
              </div>
            );
          })
        }
      </div>
    );

  };

}

ReviewFilters.propTypes = {
};

export default ReviewFilters;
