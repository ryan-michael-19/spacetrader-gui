import type { components } from "../lib/types";
export function AgentDataTable({ agentData }: { agentData: components["schemas"]["Agent"] | undefined }) {
  // TODO: Error handling when we get bad agentdata
  return (
    <>
    <table className="general-table">
      <caption>Player Info</caption>
      <tbody>
      <tr>
        <th>Account ID</th>
        <th>Name</th>
        <th>HQ</th>
        <th>Credits</th>
      </tr>
      <tr>
        <td>{agentData?.accountId}</td>
        <td>{agentData?.symbol}</td>
        <td>{agentData?.headquarters}</td>
        <td>{agentData?.credits}</td>
      </tr>
      </tbody>
    </table>
    </>
  )
}