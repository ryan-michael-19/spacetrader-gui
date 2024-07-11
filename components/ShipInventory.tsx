import { components } from '../lib/types';

export function ShipInventory ({ShipInventory}: {ShipInventory: components['schemas']['Ship'][]}) {
    return (
        <table className="general-table">
            <caption>Ship Inventory</caption>
            <tr>
                <th>Symbol</th>
                <th>Frame</th>
                <th>Registered Name</th>
                <th>Origin</th>
                <th>Destination</th>
            </tr> 
            {ShipInventory.map(
                ship => (
                    <tr>
                        <td>{ship.symbol}</td>
                        <td>{ship.frame.symbol.slice(6)/*remove FRAME_ from the symbol*/}</td>
                        <td>{ship.registration.name}</td>
                        <td>{ship.nav.route.origin.symbol}</td>
                        <td>{ship.nav.route.destination.symbol}</td>
                    </tr>
                )
            )
            }
        </table>
    )
}
