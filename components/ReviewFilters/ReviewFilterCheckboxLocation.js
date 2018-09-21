import React from 'react';

// Import Components
import { Checkbox } from 'semantic-ui-react';

function ReviewFilterCheckboxLocation(props) {

  const handleToggleLocationVisibility = () => {
    props.toggleLocationVisibility(props.locationObj._id);
  };

  const label = (
      <label>
        {props.locationObj.name}
        <b>{' '+props.locationBuzzerScore+' Bs'}</b>
        <div className="ui teal circular label">
          {props.locationStoredReviewCount}
        </div>
      </label>
    );

  return (
    <Checkbox  
      slider
      label={label} 
      checked={props.filterState}
      onChange={handleToggleLocationVisibility}
      />
  );
}

export default ReviewFilterCheckboxLocation;
