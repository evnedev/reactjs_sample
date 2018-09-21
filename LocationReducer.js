import { LOCATION_ACTION_TYPES } from './LocationActions';
import _ from 'lodash';

// Initial State
const initialState = { 
  scraps_by_ids: null,
  
  reviews_array: [],
  reviews_array_length: 0,

  show_loadmore_spinner: true,
  
  display_limit: 0,

  filters: {
    locations: {},
    scraps: {},
    sort_order: 'created_desc',
  },
};

const LocationReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOCATION_ACTION_TYPES.SET_SCRAPS_BY_IDS: {
      const scraps_by_ids = state.scraps_by_ids ? state.scraps_by_ids : {};
      for (let scrap_id in action.scraps_by_ids) {
        if (typeof scraps_by_ids[scrap_id] === 'undefined'){
          scraps_by_ids[scrap_id] = action.scraps_by_ids[scrap_id];
        }
      }
      
      return { ...state, scraps_by_ids: {...scraps_by_ids} };
    }
    case LOCATION_ACTION_TYPES.DELETE_SCRAP_FROM_BY_IDS: {
      const scraps_by_ids = state.scraps_by_ids ? state.scraps_by_ids : {};
      const {
        user_locations,
        user_competitor_locations,
      } = action;
      const allLocations = [...user_locations,...user_competitor_locations];
      let scrapUsedInAnother = false;
      allLocations.forEach(loc => {
        if (!scrapUsedInAnother && loc._id !== action.location_id && loc.scraps.indexOf(action.scrap_id) !== -1) {
          scrapUsedInAnother = true;
        }
      });
      if (!scrapUsedInAnother) {
        delete scraps_by_ids[action.scrap_id];
      }
      let reviews_array = state.reviews_array;
      let reviews_array_length = state.reviews_array_length;
      if ( user_locations.findIndex(ul=> ul._id === action.location_id) !== -1 ) {
        reviews_array = reviews_array.filter(r => action.scrap_id !== r.scrap);
        reviews_array_length = reviews_array.length;
      }
      return { ...state, scraps_by_ids: {...scraps_by_ids}, reviews_array: [...reviews_array], reviews_array_length };
    }
    case LOCATION_ACTION_TYPES.DELETE_LOCATION_BY_ID: {
      const scraps_by_ids = state.scraps_by_ids ? state.scraps_by_ids : {};
      const {
        user_locations,
        user_competitor_locations,
      } = action;
      const allLocations = [...user_locations,...user_competitor_locations];
      let scrapUsedInAnother = false;
      const locationToDelete = allLocations.find(l=>l._id === action.location_id);
      if ( !locationToDelete ){
        return state;
      }
      let scrapsIdsToDelete = locationToDelete.scraps;
      allLocations.forEach(loc => {
        if (!scrapUsedInAnother && loc._id !== action.location_id) {
          scrapsIdsToDelete = scrapsIdsToDelete.filter(s_id => loc.scraps.indexOf(s_id) === -1);
        }
      });
      scrapsIdsToDelete.forEach(s_id => {
        delete scraps_by_ids[s_id];
      });
      return { ...state, scraps_by_ids: {...scraps_by_ids} };
    }
    case LOCATION_ACTION_TYPES.ADD_REVIEWS_TO_ARRAY: {
      let reviews_array = [];
      if (!action.with_clear) {
        reviews_array = (action.with_uniq)
          ? [...action.reviews,...state.reviews_array]
          : [...state.reviews_array,...action.reviews];
      } else {
        reviews_array = action.reviews;
      }
      
      if ( action.with_uniq ) {
        const uniq_reviews_array = _.uniqBy(reviews_array, r => r._id );
        reviews_array = [...uniq_reviews_array];
      }
      const reviews_array_length = reviews_array.length;
      const show_loadmore_spinner = (!action.with_uniq) ? reviews_array_length !== state.reviews_array_length : true;
      return { ...state, reviews_array, reviews_array_length, show_loadmore_spinner };
    }
    case LOCATION_ACTION_TYPES.CLAER_REVIEWS_ARRAY: {
      return { ...state, reviews_array:[], reviews_array_length:0, show_loadmore_spinner: true };
    }
    case LOCATION_ACTION_TYPES.CLAER_LOCATIONS_INFO: {
      return { ...state, ...initialState };
    }
    case LOCATION_ACTION_TYPES.CHANGE_SHOW_LOADMORE_SPINNER: {
      return { ...state, show_loadmore_spinner: action.show_loadmore_spinner };
    }
    case LOCATION_ACTION_TYPES.CHANGE_DISPLAY_LIMIT: {
      return { ...state, display_limit: action.display_limit };
    }

    case LOCATION_ACTION_TYPES.CHANGE_SCRAP_STORED_REVIEW_COUNT: {
      const { scraps_by_ids } = state;
      if ( scraps_by_ids && scraps_by_ids[action.scrap_id] ) {
          const new_average_rating = (scraps_by_ids[action.scrap_id].average_rating*scraps_by_ids[action.scrap_id].stored_review_count + action.new_reviews_rating_sum)/(scraps_by_ids[action.scrap_id].stored_review_count+action.new_review_count);
          scraps_by_ids[action.scrap_id].average_rating = new_average_rating;
          scraps_by_ids[action.scrap_id].average_rating_100 = Math.round(new_average_rating/action.source_max_rating * 10000) / 100;
          scraps_by_ids[action.scrap_id].stored_review_count += action.new_review_count;
          scraps_by_ids[action.scrap_id].promoters_count += action.promoters_count;
          scraps_by_ids[action.scrap_id].detractors_count += action.detractors_count;
          return { ...state, scraps_by_ids: {...scraps_by_ids} };
      }
      else{
        return state;
      }
    }


    case LOCATION_ACTION_TYPES.CHANGE_LOCATION_VISIBILITY: {
      const { filters } = state;
      if ( filters.locations[action.location_id] ){
        filters.locations[action.location_id] = (typeof action.visibility === "boolean") ? action.visibility : !filters.locations[action.location_id];
      }
      else{
        filters.locations[action.location_id] = true;
      }
      return { ...state, filters };
    }

    case LOCATION_ACTION_TYPES.CHANGE_SCRAP_VISIBILITY: {
      const { filters } = state;
      if ( filters.scraps[action.scrap_id] ){
        filters.scraps[action.scrap_id] = (typeof action.visibility === "boolean") ? action.visibility : !filters.scraps[action.scrap_id];
      }
      else{
        filters.scraps[action.scrap_id] = true;
      }
      return { ...state, filters };
    }

    case LOCATION_ACTION_TYPES.RESET_FILTERS: {
      return { ...state, filters: {...initialState.filters} };
    }


    case LOCATION_ACTION_TYPES.CHANGE_SORT_ORDER: {
      const { filters } = state;
      filters.sort_order = action.sort_order;
      return { ...state, filters };
    }

    default:
      return state;
  }
};



/* Selectors */

// Get all locations
export const getUserLocations = state => state.app.user_locations;
export const getUserCompetitorLocations = state => state.app.user_competitor_locations;

// Get location by cuid
export const getUserLocationById = (state, id) => state.app.user_locations.find(item => item._id === id);
export const getUserLocationByGooglePlaceId = (state, googlePlaceId) => state.app.user_locations.find(item => item.googlePlaceId === googlePlaceId);

// Get scraps by ids
export const getScrapsByIds = state => state.location.scraps_by_ids;

// Get scraps chunked by scraps locations
export const getScrapsChunkedByLocations = (state) => {
  const scraps_by_ids = getScrapsByIds(state);
  const user_locations_all = [...getUserLocations(state),...getUserCompetitorLocations(state)];
  const scraps_by_locations = {};

  user_locations_all.forEach(l=>{
    if (typeof scraps_by_locations[l._id] === 'undefined') {
      scraps_by_locations[l._id] = [];
      l.scraps.forEach(l_scrap_id=>{
        if (scraps_by_ids[l_scrap_id]){
          scraps_by_locations[l._id].push(scraps_by_ids[l_scrap_id]);
        }
      });
    }
  });
  return scraps_by_locations;
}

export const getReviewsArray = state => state.location.reviews_array;
export const getReviewsArrayLength = state => state.location.reviews_array_length;

export const getShowLoadmoreSpinner = state => state.location.show_loadmore_spinner;

export const getDisplayLimit = state => state.location.display_limit;

export const getFilters = state => state.location.filters;


// Export Reducer
export default LocationReducer;
