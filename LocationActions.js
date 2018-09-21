import callApi from '../../util/apiCaller';
import async from 'async';
import { 
    getUserLocations,
    getUserCompetitorLocations,
    getScrapsByIds,
    getReviewsArray,
    getReviewsArrayLength,
    getFilters,
  } from './LocationReducer';

// Export Constants
export const LOCATION_ACTION_TYPES = {
  CLAER_LOCATIONS_INFO : 'CLAER_LOCATIONS_INFO',
  
  SET_SCRAPS_BY_IDS : 'SET_SCRAPS_BY_IDS',
  DELETE_SCRAP_FROM_BY_IDS : 'DELETE_SCRAP_FROM_BY_IDS',

  DELETE_LOCATION_BY_ID : 'DELETE_LOCATION_BY_ID',
  
  ADD_REVIEWS_TO_ARRAY : 'ADD_REVIEWS_TO_ARRAY',

  CHANGE_SCRAP_STORED_REVIEW_COUNT : 'CHANGE_SCRAP_STORED_REVIEW_COUNT',

  CLAER_REVIEWS_ARRAY : 'CLAER_REVIEWS_ARRAY',

  CHANGE_LOCATION_VISIBILITY : 'CHANGE_LOCATION_VISIBILITY',
  CHANGE_SCRAP_VISIBILITY : 'CHANGE_SCRAP_VISIBILITY',
  CHANGE_SORT_ORDER : 'CHANGE_SORT_ORDER',
  RESET_FILTERS : 'RESET_FILTERS',

  CHANGE_SHOW_LOADMORE_SPINNER : 'CHANGE_SHOW_LOADMORE_SPINNER',
};

export const REVIEWS_FETCH_LIMIT = 25;

export function recieveLocationsInfo(locations, is_competitor_locations = false, force_first_fetch = false) {
  return (dispatch, getState) => {
    let scrapsIdsArr = [];
    let _force_first_fetch = force_first_fetch;
    const scraps_by_ids = getScrapsByIds(getState());
    if (!locations || !locations.length || locations === null){
      locations = getUserLocations(getState());
      _force_first_fetch = true;
    }
    locations.map(location => {
      if (location.scraps && location.scraps.length){
        scrapsIdsArr = [...scrapsIdsArr, ...location.scraps];
      }
    });
    
    if ( !is_competitor_locations ){
      if ( scraps_by_ids === null ){
        locations.forEach(location => {
          dispatch(changeLocationVisibility(location._id,true));
        });
        scrapsIdsArr.forEach(scrap_id => {
          dispatch(changeScrapVisibility(scrap_id,true));
        });
      }
      else if ( locations[0] && locations[0].scraps ) {
        locations[0].scraps.forEach(scrap_id => {
          dispatch(changeScrapVisibility(scrap_id,true));
        });
      }
    }

    if ( scrapsIdsArr && scrapsIdsArr.length ){
      dispatch(setScrapsByIds(scrapsIdsArr,locations))
        .then(scraps_by_ids => {
          dispatch(fetchReviewsForScraps(scraps_by_ids,locations,is_competitor_locations,_force_first_fetch));
          if ( !is_competitor_locations ){
            dispatch(addReviewsByScraps(scrapsIdsArr,0));
          }
        })
        .catch(err => {
          console.log('recieveLocationsInfo setScrapsByIds error',err);
        });
    }
  };
}

export function clearLocationsInfo() {
  return {
    type: LOCATION_ACTION_TYPES.CLAER_LOCATIONS_INFO,
  };
}

export function setScrapsByIdsSuccess(scraps_by_ids) {
  return {
    type: LOCATION_ACTION_TYPES.SET_SCRAPS_BY_IDS,
    scraps_by_ids,
  };
}


export function setScrapsByIds(scrapsIdsArr,locations) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      callApi('scrap/byids','post',{ids:scrapsIdsArr},true)
        .then(scraps => { 
          const scraps_by_ids = {};
          scraps.forEach(s => {
            if ( s.top_words && s.top_words.length && s.top_words[0] && typeof s.top_words[0].frequency !== 'undefined' ){
              s.top_words = s.top_words.sort((a,b)=>((a.frequency < b.frequency) ? 1 : ((b.frequency < a.frequency) ? -1 : 0)));
            }
            scraps_by_ids[s._id] = s;
          });
          dispatch(setScrapsByIdsSuccess(scraps_by_ids));
          resolve(scraps_by_ids);
        })
        .catch(err=>{
          reject(err);
        });
    });
  };
}


export function deleteScrapFromByIds(location_id,scrap_id) {
  return (dispatch,getState) => {
    const state = getState();
    const user_locations = getUserLocations(state);
    const user_competitor_locations = getUserCompetitorLocations(state);
    dispatch({
      type: LOCATION_ACTION_TYPES.DELETE_SCRAP_FROM_BY_IDS,
      user_locations,
      user_competitor_locations,
      location_id,
      scrap_id,
    });
    dispatch(moreReviewsByScraps(undefined,undefined,false,true));
  };
}

export function deleteLocationById(location_id) {
  return (dispatch,getState) => {
    const state = getState();
    const user_locations = getUserLocations(state);
    const user_competitor_locations = getUserCompetitorLocations(state);
    dispatch({
      type: LOCATION_ACTION_TYPES.DELETE_LOCATION_BY_ID,
      user_locations,
      user_competitor_locations,
      allLocations: [...user_locations,...user_competitor_locations],
      location_id,
      competitor: false,
    });
    dispatch(moreReviewsByScraps(undefined,undefined,false,true));
  };
}

export function deleteCompetitorLocationById(location_id) {
  return (dispatch,getState) => {
    const state = getState();
    const user_locations = getUserLocations(state);
    const user_competitor_locations = getUserCompetitorLocations(state);
    dispatch({
      type: LOCATION_ACTION_TYPES.DELETE_LOCATION_BY_ID,
      user_locations,
      user_competitor_locations,
      location_id,
      competitor: true,
    });
  };
}

export function addReviewsToArraySuccess(reviews, with_uniq = false, with_clear = false) {
  return {
    type: LOCATION_ACTION_TYPES.ADD_REVIEWS_TO_ARRAY,
    reviews,
    with_uniq,
    with_clear,
  };
}

export function addReviewsByScraps(scrapsIdsArr, _skip, with_uniq = false, with_clear = false) {
  return (dispatch,getState) => {
    const state = getState();
    const filters = getFilters(state);
    const query = {scrap:scrapsIdsArr};
    const limit = REVIEWS_FETCH_LIMIT;
    const sort = filters.sort_order;
    const skip = ( typeof _skip === 'undefined' || !_skip ) ? 0 : _skip;
    callApi('review/byquery','post',{query,limit,sort,skip},true)
      .then(reviews => { 
        if ( reviews && reviews.length ){
          dispatch(addReviewsToArraySuccess(reviews,with_uniq,with_clear));
        }
        else if ( !with_uniq ){
          dispatch(changeShowLoadmoreSpinner(false));
        }
      })
      .catch(err=>{
      });
  };
}


export function clearReviewsArray() {
  return (dispatch) => {
    return new Promise( async (resolve) => {
      await dispatch({
        type: LOCATION_ACTION_TYPES.CLAER_REVIEWS_ARRAY,
      });
      resolve(true);
    });
  };
}

export function moreReviewsByScraps(_scraps_by_ids, _skip, with_uniq = false, with_clear = false) {
  return (dispatch,getState) => {
    const state = getState();
    const filters = getFilters(state);
    const locations = getUserLocations(state);
    const skip = (typeof _skip !== 'undefined') ? _skip : getReviewsArrayLength(state);
    const scraps_by_ids = (typeof _scraps_by_ids !== 'undefined') ? _scraps_by_ids : getScrapsByIds(state);
    const scrapsIdsArr = [];
    for (let scrap_id in scraps_by_ids) {
      const location = locations.find(l => l.scraps.indexOf(scrap_id) !== -1);
      if ( location && location._id && filters.locations[location._id] && filters.scraps[scrap_id] ) {
        scrapsIdsArr.push(scrap_id);
      }
    }
    if ( scrapsIdsArr.length ){
      dispatch(addReviewsByScraps(scrapsIdsArr,skip,with_uniq,with_clear));
    }
    else if ( !with_uniq ){
      dispatch(changeShowLoadmoreSpinner(false));
    }
  };
}

export function fetchReviewsForScraps(scraps_by_ids,locations,is_competitor_locations = false,force_first_fetch) {
  return (dispatch,getState) => {

    const fetchReviewsPathPref = 'scrap/fetch/';
    const sources = getState().app.sources;
    const reviews_chunked_by_scraps_length = {};
    
    let callsQueue = async.queue((task, done) => {
      const call_body = { 
        scrap_id: task.scrap_id, 
        page: task.page,
      };

      if ( force_first_fetch ){
        call_body.uh = true;
      }

      callApi(fetchReviewsPathPref+task.code, 'post', call_body, true)
        .then(fetch_result => {
          let _count_try_again = task.count_try_again;
          let have_new_reviews = fetch_result && typeof fetch_result.new_reviews_result !== 'undefined' && fetch_result.new_reviews_result !== 0;
          let next_page = 1;
          
          if ( have_new_reviews ) {
            dispatch(changeScrapStoredReviewCount(task.scrap_id,fetch_result.new_reviews_result,fetch_result.new_reviews_rating_sum,task.max_rating, fetch_result.promoters_count, fetch_result.detractors_count));
            reviews_chunked_by_scraps_length[task.scrap_id] += fetch_result.new_reviews_result;
            if ( !is_competitor_locations && reviews_chunked_by_scraps_length[task.scrap_id] < REVIEWS_FETCH_LIMIT ){
              dispatch(moreReviewsByScraps(scraps_by_ids,0,true,false));
            }
            if ( typeof task.page !== 'string' && fetch_result.next_page === null ) {
              next_page = task.page+1;
            }
            else if ( fetch_result && fetch_result.next_page !== null ){
              next_page = fetch_result.next_page;
            }

            callsQueue.push({code:task.code,max_rating:task.max_rating,location_id:task.location_id,scrap_id:task.scrap_id,page:next_page,count_try_again:_count_try_again});
          }
          else if ( _count_try_again ){ 
            _count_try_again -= 1;
            if ( typeof task.page !== 'string' ) {
              next_page = task.page+1;
            }
            else if ( fetch_result && fetch_result.next_page !== null ){
              next_page = fetch_result.next_page;
            }
            else{
              done();
              return null;
            }
            
            callsQueue.push({code:task.code,max_rating:task.max_rating,location_id:task.location_id,scrap_id:task.scrap_id,page:next_page,count_try_again:_count_try_again});
          }
          done();  
        })
        .catch(err=>{
          console.log('fetchReviewsForScraps callApi error',err);
          done();
        });
    }, 6 );

    for (let scrap_id in scraps_by_ids) {
      const scr = scraps_by_ids[scrap_id];
      const scrap_source = sources.find(so => so._id === scr.source);
      reviews_chunked_by_scraps_length[scr._id] = 0;
      const location = locations.find(l => l.scraps.indexOf(scr._id) !== -1);
      if ( scrap_source && scrap_source.code && location && location._id ){
        callsQueue.push({code:scrap_source.code,max_rating:scrap_source.max_rating,location_id:location._id,scrap_id:scr._id,page:1,count_try_again:0});
        if ( typeof scr.lastScrappedStatus !== 'undefined' && scr.lastScrappedStatus === false && scr.lastScrappedPage ){
          let _page = scr.lastScrappedPage;
          if ( _page.indexOf(':') === -1 ) {
            _page = Number(_page);
          }
          if ( _page ){
            callsQueue.push({code:scrap_source.code,max_rating:scrap_source.max_rating,location_id:location._id,scrap_id:scr._id,page:_page,count_try_again:3});
          }
        }
      }
    }
  };
}


export function changeScrapStoredReviewCount(scrap_id, new_review_count, new_reviews_rating_sum, source_max_rating, promoters_count, detractors_count) {
  return {
    type: LOCATION_ACTION_TYPES.CHANGE_SCRAP_STORED_REVIEW_COUNT,
    scrap_id,
    new_review_count,
    promoters_count,
    detractors_count,
    new_reviews_rating_sum,
    source_max_rating,
  };
}



export function changeLocationVisibility(location_id, visibility = null){
  return {
    type: LOCATION_ACTION_TYPES.CHANGE_LOCATION_VISIBILITY,
    location_id,
    visibility,
  };
}

export function changeScrapVisibility(scrap_id, visibility = null){
  return {
    type: LOCATION_ACTION_TYPES.CHANGE_SCRAP_VISIBILITY,
    scrap_id,
    visibility,
  };
}

export function changeSortOrder(sort_order){
  return {
    type: LOCATION_ACTION_TYPES.CHANGE_SORT_ORDER,
    sort_order,
  };
}

export function resetFilters(){
  return {
    type: LOCATION_ACTION_TYPES.RESET_FILTERS,
  };
}

export function changeShowLoadmoreSpinner(show_loadmore_spinner){
  return {
    type: LOCATION_ACTION_TYPES.CHANGE_SHOW_LOADMORE_SPINNER,
    show_loadmore_spinner,
  };
}

