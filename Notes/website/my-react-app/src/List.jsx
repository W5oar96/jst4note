import PropTypes from 'prop-types';

function List(props) {

    const category = props.category;
    const itemList = props.items;

    const listItems = itemList.map(item => <li key={item.id}>
                                            {item.name}: &nbsp;
                                            <b>{item.calories}</b>
                                            </li> )
    
    return(<>
            <h3 className="list-category">{category}</h3>
            <ol className="list-item">{listItems}</ol>
            </>);
}

List.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({id: PropTypes.number,
                                            name: PropTypes.string,
                                            calories: PropTypes.number,
                                        })),
    category: PropTypes.string,
}

List.defaultProps = {
    items: [],
    category: "Category",
};

export default List