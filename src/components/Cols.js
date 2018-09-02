import React, {Component} from 'react';
import PropTypes from 'prop-types';
import chunk from 'lodash/chunk';
import classNames from 'classnames';

export default class Cols extends Component{
	
	static propTypes = {
		maxPerRow: PropTypes.number,

		// bootstrap sizes, overwriting maxPerRow
		layout: PropTypes.arrayOf(PropTypes.number),

		label: PropTypes.string,

		tightRows: PropTypes.bool
	};

	static defaultProps = {
		maxPerRow: 4,
		noPaddingBetween: false,
		tightRows: true
	};

	render(){
		let {
			maxPerRow,
			children,
			layout,
			label,
			noPaddingBetween,
			tightRows
		} = this.props;
		
		let totalChildren = React.Children.count(children);

		if (layout && layout.length){
			maxPerRow = layout.length;
		}

		let perRow = totalChildren > maxPerRow
			? maxPerRow
			: totalChildren;

		let rows = chunk(
			React.Children.toArray(children),
			perRow
		);

		const bsSize = Math.floor(12 / perRow);

		let elements = rows.map((r, rIdx) => 
			<div className="row" key={`row-${rIdx}`}>{
				React.Children.map(r, (c, cIdx) =>
					<div
						key={cIdx}
						className={classNames(
							`col`,
							`col-xs-12`,
							`col-sm-${
								layout
								? layout[cIdx]
								: bsSize
							}`
						)}
						children={c}
						style={(() => {
							let style = {};
							if (perRow == 2 && cIdx == 0){
								style.paddingRight = 0;
							}
							if (perRow == 2 && cIdx == 1 && tightRows){
								style.paddingLeft = 0;	
							}
							return style;
						})()}
					/>
				)
			}</div>
		);
		if (label){
			elements.unshift(
				<label
					key="label"
					className="control-label"
					children={label}
				/>
			)
		}

		return elements;
	}

}
