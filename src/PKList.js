import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import escapeRegExp from 'lodash/escapeRegExp';
import isUndefined from 'lodash/isUndefined';
import xClass from './utils/xClass';
import FlipMove from 'react-flip-move';
import Cols from './components/Cols';
import {
	TransitionMotion,
	spring,
	preset
} from 'react-motion';


export default class PKList extends React.Component{

	static propTypes = {
		items: 		PropTypes.arrayOf(PropTypes.object),
		heading: 	PropTypes.string,
		wrapClass: 	PropTypes.string,
		pictureKey: PropTypes.string,
		formatItem: PropTypes.func,
		searchFmt: 	PropTypes.func,
		searchKey: 	PropTypes.string,
		displayKey: PropTypes.string,
		clicked: 	PropTypes.func,
		deleted: 	PropTypes.func,
		fadeTransition: PropTypes.bool,
		columns: PropTypes.arrayOf(
			PropTypes.object
		)
	};

	static defaultProps = {
		perRow: 4,
		pagination: false,
		fadeTransition: false,
		sortKey: 'name'
	};

	constructor(props){
		super(props);
		this.state = {
			filtered: "",
			page: 1,
			lastClickIdx: undefined,
			sortKey: props.sortKey,
			sortAsc: true
		};
	}

	clearSearch = () => {
		this.setState({
			filtered: "",
			lastClickIdx: undefined,
			page: 1
		});
	}

	searchRef = (input) => {
		if (input && this.props.setSearchFocus && !this.alreadyFocused){
			input.focus();
			this.alreadyFocused = true;
		}
	}

	onSearchChange = (e) => {
		this.setState({
			filtered: e.target.value,
			lastClickIdx: undefined,
			page: 1
		});
	}

	isInSearch = (haystack) => {
		let needle = this.state.filtered;
		if (needle){
			let needles = escapeRegExp(needle)
				.toLowerCase()
				.split(' ');
			for (let s of needles){
				if (haystack.search(s) < 0){
					return false;
				}
			}
		}
		return true;
	}

	setPage = p => {
		this.setState({
			page: p,
			lastClickIdx: undefined
		});
	}

	// **************************
	// Transition style functions
	// **************************

	itemWillLeave = () => ({
		opacity: spring(0)
	})

	itemWillEnter = () => ({
		opacity: 0
	})

	getDefaultStyle = (item) => ({
		key: item.id,
		data: item,
		style: {
			opacity: 0
		}
	})

	getStyle = (item) => ({
		key: item.id,
		style: {opacity: spring(1)},
		data: item
	})

	getHeaderRow = () => {
		let {columns} = this.props
		let {sortKey, sortAsc} = this.state;

		return (
			<div className="header-row">
				<Cols>{
					columns.map(s =>
						<span
							key={s.label}
							onClick={() => {
								this.setState((state) => ({
									sortKey: s.key,
									sortAsc: state.sortKey == s.key
										? !state.sortAsc
										: true
								}))
							}}
							className={xClass(
								'header-field',
								sortKey == s.key
									? (sortAsc ? 'asc' : 'desc')
									: ''
							)}
						>{s.label}</span>
					)
				}</Cols>
			</div>
		);
	}

	sorter = (a, b) => {
		let {columns} = this.props;
		let {sortKey, sortAsc} = this.state;

		let colData = columns.find(c => c.key == sortKey);

		let sorted = typeof colData.sorter === 'function'
			? colData.sorter(a, b)
			: this.alphaSort(a, b);
		if (!sortAsc){
			sorted *= -1;
		}
		return sorted;
	}

	alphaSort = (a, b) => {
		let {sortKey} = this.state;
		return a[sortKey].toLowerCase() < b[sortKey].toLowerCase()	? -1 : 1;	
	}


	// ****************
	// Search Filtering
	// ****************

	visibleItems = () => {
		let {
			searchKey,
			displayKey,
			searchFmt,
			sorter,
			pagination
		} = this.props;

		let items = this.props.items ? this.props.items.slice() : [];

		// sort
		if (isFunction(sorter)){
			items.sort(sorter);
		}

		// search filter
		items = items.filter(item =>
			this.isInSearch(
				isFunction(searchFmt)
				? searchFmt(item).toLowerCase()
				: item[searchKey || displayKey]
			)
		);

		// pagination
		let {page} = this.state
		let numPages = Math.ceil(items.length / pagination);
		let pages = [];

		if (pagination){
			var start = (page - 1) * pagination;
			var end;
			if (start + pagination > items.length){
				end = items.length;
			}
			else {
				end = start + pagination + 1;
			}
			items = items.slice(start, end);
			
			for (var i = 0; i < numPages; i++){
				pages[i] = i + 1;
			}
		}
		return {items, pages, numPages};
	}

	onClick = (item, e) => {
		let {clicked} = this.props;
		let {lastClickIdx} = this.state;
		let {items} = this.visibleItems();
		let myIdx = items.indexOf(item);
		if (e.shiftKey){
			if (lastClickIdx !== undefined){
				// add to selection everything between the lastIdx and this idx
				let range = [myIdx, lastClickIdx].sort();
				range[1]++;
				clicked(items.slice(...range));
			}
		}
		else {
			this.setState({lastClickIdx: myIdx}, () => clicked(item));
		}
	}

	getElement = ({
		item,
		idx,
		totalItems,
		recentEdits,
		style={}
	}) => {
		let {
			deleted,
			formatItem,
			locked,
			selected,
			perRow,
			pictureKey,
			titleFunc
		} = this.props;
		const cellStyle = {
			width: `${100 / perRow}%`,
			// Dropdowns won't stack correctly
			// unless previous item list has
			// a higher z-index
			zIndex: totalItems - idx,
			...style
		};
		// pic as list item background image
		if (pictureKey && item[pictureKey]){
			let picKey = `url(${item[pictureKey]})`;
			cellStyle['backgroundImage'] = picKey;
		}
		let postIsLocked = locked && locked[item.id.toString()];
		return (
			<PKListItem
				key={item.id || idx}
				title={
					isFunction(titleFunc)
					? titleFunc(item)
					: `${item.id}`
				}
				cellStyle={cellStyle}
				onClick={
					!postIsLocked ?
					this.onClick.bind(null, item)
					: undefined
				}
				onDelete={
					deleted ?
					deleted.bind(null, item)
					: undefined
				}
				display={
					isFunction(formatItem)
					? formatItem(item)
					: item[displayKey]
				}
				selected={
					selected ? isObject(
						selected.find(sel => sel.id == item.id)
					) : false
				}
				recentlyEdited={
					!isUndefined(
						recentEdits.find(
							id => item.id.toString() == id.toString()
						)
					)
				}
				locked={
					postIsLocked
					? locked[item.id.toString()].user.name
					: false
				}
			/>
		);
	}

	render(){

		let {
			wrapClass,
			searchKey,
			displayKey,
			searchFmt,
			deleted,
			clicked,
			perRow,
			sorter,
			headerRow,
			pagination,
			multi,
			lastEdited,
			fadeTransition,
			children
		} = this.props;
		let {page, filtered} = this.state;

		let {items, pages, numPages} = this.visibleItems();

		let recentEdits = [];
		if (isArray(lastEdited)){
			recentEdits = lastEdited.slice();
		}
		else if (lastEdited){
			recentEdits.push(lastEdited);
		}

		return (
			<div className={xClass('pure-list', wrapClass)}>
				<div className="search-row">
					<input
						className="form-control"
						placeholder="search..."
						ref={this.searchRef}
						onChange={this.onSearchChange}
						value={filtered}
					/>
					{filtered && (
						<button
							className="clear-search"
							onClick={this.clearSearch}
							title="clear search"
							children="×"
						/>
					)}
					{pagination && numPages > 1 ? (
						<div
							className="pagination"
							data-status="pagination"
						>{pages.map(p =>
							<a 	key={`page-${p}`}
								onClick={this.setPage.bind(null, p)}
								className={xClass({selected: p == page})}
							>{p}</a>
						)}</div>
					) : null}
					<div className="children">{
						children || null
					}</div>
				</div>
				<div className="pure-list-table">
					{headerRow ? (
						<div
							key="header-row"
							className="header-row"
						>{headerRow}</div>
					) : this.getHeaderRow()}
					<div>{fadeTransition
						? (<TransitionMotion
							willEnter={this.itemWillEnter}
							willLeave={this.itemWillLeave}
							styles={items.map(
								item => this.getStyle(item)
							)}
							defaultStyles={items.map(
								item => this.getDefaultStyle(item)
							)}
						>{(interpolatedStyles, idx) => 
							<div>{
							interpolatedStyles ? 
							interpolatedStyles.map(({key, style, data}) =>
								this.getElement({
									item: data,
									idx,
									totalItems: items.length,
									style,
									recentEdits
								})
							) : null
							}</div>
						}
						</TransitionMotion>)
						: <FlipMove duration={100}>{
								items
								.sort(this.sorter)
								.map((item, idx) =>
									this.getElement({
										item,
										idx,
										totalItems: items.length,
										recentEdits
									})
								)
							}</FlipMove>
					}</div>
				</div>
			</div>
		);
	}

}


export class PKListItem extends PureComponent{
	
	constructor(props){
		super(props);
		this.state = {};
	}

	render(){
		let {
			cellStyle,
			onClick,
			display,
			onDelete,
			selected,
			recentlyEdited,
			title,
			locked
		} = this.props;
		return (
			<div
				className={xClass({
					"pure-list-item": true,
					"selected": selected === true,
					"recent": recentlyEdited === true,
					"locked": locked !== false
				})}
				style={cellStyle}
				onClick={onClick}
				data-status={
					locked === false
					? title
					: "locked by " + locked
				}
				title={
					locked === false
					? title
					: "locked by " + locked
				}
			>
				{display}
				{typeof onDelete === 'function' ? (
					<button className="delete-button" onClick={onDelete}>x</button>
				) : null}
			</div>
		);
	}

}
