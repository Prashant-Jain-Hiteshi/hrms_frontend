# PowerShell script to fix department dropdown in RecruitmentManagement.jsx

$filePath = "c:\Users\jainm\Documents\hrms_fe_Be\hrms_frontend\src\components\Recruitment\RecruitmentManagement.jsx"

# Read the file content
$content = Get-Content $filePath -Raw

# Replace the first department dropdown (Post Job Modal)
$oldPattern1 = @"
                  <option value="">Select Department</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
"@

$newPattern1 = @"
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
"@

# Replace the second department dropdown (Edit Job Modal)
$oldPattern2 = @"
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">Human Resources</option>
                    <option value="Finance">Finance</option>
"@

$newPattern2 = @"
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
"@

# Apply replacements
$content = $content -replace [regex]::Escape($oldPattern1), $newPattern1
$content = $content -replace [regex]::Escape($oldPattern2), $newPattern2

# Write back to file
Set-Content $filePath $content -Encoding UTF8

Write-Host "✅ Department dropdowns fixed successfully!"
Write-Host "🔄 Now the dropdowns will use real department data from backend"
