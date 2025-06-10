document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("medicineSearch");
  const searchButton = document.getElementById("searchButton");
  const lowStockButton = document.getElementById("lowStockButton");
  const tableBody = document.getElementById("medicineTableBody");

  let lowStockFilterActive = false;

  function filterMedicines() {
    const filter = searchInput.value.toLowerCase();
    const rows = tableBody.getElementsByTagName("tr");

    let visibleCount = 0;

    for (let row of rows) {
      const nameCell = row.cells[0].textContent.toLowerCase();
      const stockCell = row.cells[3];
      const stock = parseInt(stockCell.textContent);

      // Check if row matches search filter
      const matchesSearch = nameCell.includes(filter);
      // Check if row matches low stock filter (if active)
      const matchesLowStock = !lowStockFilterActive || (stock < 10);

      if (matchesSearch && matchesLowStock) {
        row.style.display = "";
        visibleCount++;
      } else {
        row.style.display = "none";
      }
    }

    if (visibleCount === 0) {
      if (!document.getElementById("noResultsRow")) {
        const noResultsRow = document.createElement("tr");
        noResultsRow.id = "noResultsRow";
        noResultsRow.innerHTML = `<td colspan="5" class="text-center text-muted">No medicines found.</td>`;
        tableBody.appendChild(noResultsRow);
      }
    } else {
      const noResultsRow = document.getElementById("noResultsRow");
      if (noResultsRow) {
        noResultsRow.remove();
      }
    }
  }

  searchInput.addEventListener("input", filterMedicines);
  searchButton.addEventListener("click", filterMedicines);

  lowStockButton.addEventListener("click", () => {
    lowStockFilterActive = !lowStockFilterActive;
    lowStockButton.classList.toggle("active", lowStockFilterActive);
    filterMedicines();
  });
});
