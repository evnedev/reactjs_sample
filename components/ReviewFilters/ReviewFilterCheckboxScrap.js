import React from 'react';

// Import Components
import { Checkbox } from 'semantic-ui-react';

function ReviewFilterCheckboxScrap(props) {

  const handleToggleScrapVisibility = () => {
    props.toggleScrapVisibility(props.scrap._id);
  };
  
  const average_rating = (props.scrap.average_rating) ? Math.round(props.scrap.average_rating * 100) / 100 : 0;

  const label = (
      <label>
        {props.scrap.name}
        {' '}
        <b>{average_rating}</b>
        <i aria-hidden="true" className="star icon teal"></i>
        {' '}
        ({props.scrap.stored_review_count})
      </label>
    );

  return (
    <Checkbox  
      checked 
      label={label} 
      checked={props.filterState}
      onChange={handleToggleScrapVisibility}
      />
  );
}

export default ReviewFilterCheckboxScrap;
