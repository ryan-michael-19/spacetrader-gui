import { components } from '../types';

export function ShipInventory ({ShipInventory}: {ShipInventory: components['schemas']['Ship'][]}) {
    return (
        <table className="general-table">
            <caption>Ship Inventory</caption>
            <tr>
                <th>Symbol</th>
                <th>Registered Name</th>
            </tr> 
            {ShipInventory.map(
                ship => (
                    <tr>
                        <td>{ship.symbol}</td>
                        <td>{ship.registration.name}</td>
                    </tr>
                )
            )
            }
        </table>
    )
}
