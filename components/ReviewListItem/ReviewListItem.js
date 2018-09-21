import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import dateformat from 'dateformat';
import _ from 'lodash';
import sentiment from 'sentiment';
import VisibilitySensor from 'react-visibility-sensor';

import { getConsumerType } from '../../../../util/helper';
import { Grid, Card, Feed, Icon, Image } from 'semantic-ui-react'

// Import Style
import styles from './ReviewListItem.css';

const colorActive = 'teal';
const colorDefault = 'grey';

const colorStdGreen = '#16ab39'; // promoter
const colorStdGrey = '#838383'; // passive
const colorStdRed = '#d01919'; // detractor

function RatingComp(props) {
  const { overallRating, minRating, maxRating, className, iconSize } = props;
  const ratingRange = _.range(minRating, maxRating+1);
  const _iconSize = (iconSize) ? ((maxRating > 6) ? 'small' : iconSize) : '';
  let _star_class = '';
  let _overallRating_mod = String(overallRating).index;
  const stars = ratingRange.map((index,i_i) => {
      // _star_class += (index<=overallRating) ? colorActive : colorDefault;
      _star_class = (index<=overallRating) ? '' : ((index-0.51<=overallRating) ? 'half empty' : 'empty');
      return (
        <i 
          key={i_i}
          aria-hidden="true" 
          className={`star icon ${styles.reviewRatingCompIcon} ${colorActive} ${_iconSize} ${_star_class}`} 
          />
      );
    });
  return (
    <span className={className} title={`${overallRating} of ${maxRating}`}>
      {stars}
    </span>
  );
}

function getConsumerTypeJsx(rating_100) {
  let type_text = null;
  let type_color = null;
  const _customer_type = getConsumerType(rating_100);
  if ( _customer_type === 0 ){
    type_text = 'Promoter';
    type_color = colorStdGreen;
  }
  else if ( _customer_type === 1 ){
    type_text = 'Passive';
    type_color = colorStdGrey;
  }
  else{
    type_text = 'Detractor';
    type_color = colorStdRed;
  }
  return (
    <span 
      style={{
        color: type_color,
      }}
      className={`ui tiny header ${styles.reviewConsumerType}`}
      >
      {type_text}
    </span>
  );
}

class ReviewListItem extends Component {

  constructor(props) {
    super(props);

    this.state = { 
      cardElementHeight: 0,
    };
  }

  shouldComponentUpdate(nextProps) {
    return this.props.reviewObj._id !== nextProps.reviewObj._id;
  }

  showCardEmelent() {
    const { cardElementHeight } = this.state;
    if ( cardElementHeight ) {
      const { style, firstChild } = this.cardElement;
      firstChild.style.display = null;
      firstChild.classList.add('in');
      style.height = null;
    }
  }

  hideCardEmelent() {
    const { style, firstChild } = this.cardElement;
    const cardElementHeight = this.cardElement.clientHeight;
    if (this.state.cardElementHeight !== cardElementHeight) {
      this.setState({ cardElementHeight });
    }
    firstChild.style.display = 'none';
    firstChild.classList.remove('in');
    style.height = `${cardElementHeight}px`;
  }

  handleChangeVisibilitySensor = (isVisible) => {
    if ( isVisible ){
      this.showCardEmelent();
    } else {
      this.hideCardEmelent();
    }
  }

  render() {

    const { 
      reviewObj, 
      indexedScraps,
      indexedSources,
      user_subscription_full,
    } = this.props;

    const reviewScrap = indexedScraps[reviewObj.scrap];
    if ( !reviewScrap ) return null;
    const reviewSource = indexedSources[reviewScrap.source];
    if ( !reviewSource ) return null;

    const review_author_photo = (reviewObj.author.photo_url) ? reviewObj.author.photo_url : 'https://buzzerfeedback.com/images/buzzer-feedback-roundel-dark.svg';
    const review_time_created = dateformat(new Date(reviewObj.time_created),"dd.mm.yy");
    const review_header = (reviewObj.author.name) ? (
        (reviewObj.author.ext_url) ? (
          <a className="summary" href={reviewObj.author.ext_url} target='_blank'>
            {reviewObj.author.name}
          </a>
        ) : <div className="summary">{reviewObj.author.name}</div>
      ) : <div className="summary">{reviewSource.name}</div>;
    const review_url = (reviewObj.ext_url) ? reviewObj.ext_url : reviewScrap.ext_url;
    const review_title = (reviewObj.title) ? <div><strong>{reviewObj.title}</strong></div> : null;
    let review_text = (reviewObj.text) ? reviewObj.text : null;
    let review_customer_type = null;
    if ( user_subscription_full ){
      const review_text_sentiment = ( reviewObj.text_sentiment ) 
        ? reviewObj.text_sentiment
        // : (review_text && reviewObj.language === 'en') 
        //   ? sentiment(reviewObj.text)
          : null;

      if ( review_text_sentiment && review_text_sentiment.negative.length ){
        review_text = review_text.replace(new RegExp('(?<!\\w)('+review_text_sentiment.negative.join('|')+')(?!\\w)','ig'),'<span style="color:'+colorStdRed+';">$1</span>');
      }
      if ( review_text_sentiment && review_text_sentiment.positive.length ){
        review_text = review_text.replace(new RegExp('(?<!\\w)('+review_text_sentiment.positive.join('|')+')(?!\\w)','ig'),'<span style="color:'+colorStdGreen+';">$1</span>');
      }

      review_customer_type = getConsumerTypeJsx(reviewObj.rating_100);
    }
    review_text = (review_text) ? 
      review_text.split('\n').map((text_item,text_key)=>
        <span key={text_key} dangerouslySetInnerHTML={{__html:text_item+'<br/>'}} />
      ) : null;

    const review_more_ratings = (reviewObj.more_ratings) ? (
      <div className={`ui grid ${styles.reviewMoreRatingGrid}`}>
        {reviewObj.more_ratings.length !== 0 && 
          reviewObj.more_ratings.map((mr, mr_key)=>(
            <div 
              className={`four wide computer sixteen wide mobile eight wide tablet column ${styles.reviewMoreRatingColumn}`}
              key={mr_key}
              >
              <RatingComp
                overallRating={mr.rating} 
                iconSize='small' 
                minRating={reviewSource.min_rating} 
                maxRating={reviewSource.max_rating} 
                /> - <span>{mr.category}</span>
            </div>
          ))
        }
      </div>
      ) : null;
    const review_photos = (reviewObj.more_media && reviewObj.more_media.photos) ? (
      <div className={styles.reviewPhotosBox}>
        <div className="ui tiny images">
          {reviewObj.more_media.photos.length !== 0 && 
            reviewObj.more_media.photos.map((mmp, mmp_key)=>(
              <a key={mmp_key} target="_blank" className="ui" href={mmp.image_big_src}>
                <img src={mmp.image_src} />
              </a>
            ))
          }
        </div>
      </div>
      ) : null;

    const description_styles = (!review_title && !review_text && !review_more_ratings && !review_photos) ?
      {marginBottom:'-1em'} : null;


    return (
      <VisibilitySensor
        onChange={this.handleChangeVisibilitySensor}
        partialVisibility={true}
        >
        <div
          className="ui fluid card"
          ref={el => (this.cardElement = el)}
          >
        <div
          className="ui fluid card fade transition"
          >
          <div className="content">
              <div className="ui feed">
                  <div className="event">
                      <div className="label">
                        <img
                          className={`ui image ${styles.reviewAutorPhoto}`}
                          src={review_author_photo}
                          />
                      </div>
                      <div className="content">
                          <div className="date">
                              {review_time_created}
                              <RatingComp
                                overallRating={reviewObj.rating}
                                minRating={reviewSource.min_rating} 
                                maxRating={reviewSource.max_rating}
                                className={styles.reviewRatingComp}
                                />
                              {review_customer_type}
                          </div>
                          {review_header}
                      </div>
                      <div className={`label ${styles.reviewSourceLabel}`}>
                        <img
                          className={`ui image ${styles.reviewSourceLabelImage}`}
                          src={reviewSource.icon_image}
                          />
                      </div>
                  </div>
              </div>
              <div className="description" style={description_styles}>
                {review_title}
                {review_text}
                {review_more_ratings}
                {review_photos}
              </div>
          </div>
          <div className={`extra content ${styles.reviewExtraContent}`}>
              <div className={`ui grid ${styles.reviewExtraContentGrid}`}>
                  <div className={`eight wide computer sixteen wide mobile eight wide tablet column ${styles.reviewExtraContentColumn}`}>
                    <i aria-hidden="true" className="location arrow icon"></i>
                    {reviewScrap.name}
                  </div>
                  <div className={`eight wide computer sixteen wide mobile eight wide tablet column ${styles.reviewExtraContentColumnRight}`}>
                      <a href={review_url} target="_blank" rel="noopener nofollow noreferrer">
                          Open in{' '}
                          <b>{reviewSource.name}</b></a>
                  </div>
              </div>
          </div>
        </div>
        </div>
      </VisibilitySensor>
    );

  };

}

ReviewListItem.propTypes = {
};

export default ReviewListItem;
