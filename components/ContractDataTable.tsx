import { WebRequestClient } from "../lib/WebRequests";
import { components } from "../lib/types";

export function ContractDataTable({webReqClient, contractData, updateContractTable}: 
  {webReqClient: WebRequestClient, contractData: components["schemas"]["Contract"][], updateContractTable: () => void}) {
  const contractTableRows = [...contractData.entries()].map(([elementNumber, element]) => (
    <tr className="selectable-row" key={elementNumber}
      onClick={async () => {
        webReqClient.POST("/my/contracts/{contractId}/accept", {
          params: {
            path: {
              contractId: element.id
            }
          }
        });
        updateContractTable()}}>
      <td>
        {element.type}
      </td>
      <td>
        {element.terms.payment.onAccepted}
      </td>
      <td>
        {element.terms.payment.onFulfilled}
      </td>
      <table className="subtable">
        <tbody>
            <tr>
              <th>Resource</th>
              <th>Destination</th>
              <th>Required Resource Count</th>
              <th>Fulfilled Resource Count</th>
            </tr>
            {
            element.terms.deliver ? [...element.terms.deliver.entries()].map(([resourceNumber, resource]) => 
            <tr key={resourceNumber}>
              <td>
                {resource.tradeSymbol}
              </td>
              <td>
                {resource.destinationSymbol}
              </td>
              <td>
                {resource.unitsRequired}
              </td>
              <td>
                {resource.unitsFulfilled}
              </td>
            </tr>
            ): null}
          </tbody>
      </table>
      <td>
        {element.accepted ? "Yes" : "No"}
      </td>
      <td>
        {element.fulfilled ? "Yes" : "No"}
      </td>
      <td>
        {element.deadlineToAccept}
      </td>
    </tr>)
  );
  return (
    <>
      <table className="general-table">
        <caption>Contract Info</caption>
        <tbody>
          <tr>
            <th>Type</th>
            <th>Accept Payment</th>
            <th>Fulfilled Payment</th>
            <th>Resources</th>
            <th>Accepted</th>
            <th>Fulfilled</th>
            <th>Deadline to Accept</th>
          </tr>
          {contractTableRows} 
            
        </tbody>
      </table>
      Click On a Contract Row to Accept It
    </>
  );
}
