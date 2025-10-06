# PowerShell script to add department loading logs

$filePath = "c:\Users\jainm\Documents\hrms_fe_Be\hrms_frontend\src\components\Recruitment\RecruitmentManagement.jsx"

# Read the file content
$content = Get-Content $filePath -Raw

# Replace the loadDepartments function with enhanced logging
$oldLoadDepartments = @"
  const loadDepartments = async () => {
    try {
      const response = await RecruitmentAPI.departments.list();
      setDepartments(response.data.data);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Failed to load departments');
    }
  };
"@

$newLoadDepartments = @"
  const loadDepartments = async () => {
    try {
      console.log('🏢 Loading departments from backend...');
      const response = await RecruitmentAPI.departments.list();
      console.log('📥 Departments API response:', response);
      console.log('🏢 Departments data:', response.data.data);
      setDepartments(response.data.data);
      console.log('✅ Departments loaded successfully:', response.data.data.length, 'departments');
    } catch (error) {
      console.error('❌ Error loading departments:', error);
      console.error('🔍 Full error object:', error);
      console.error('📄 Error response:', error.response);
      toast.error('Failed to load departments');
    }
  };
"@

# Apply replacement
$content = $content -replace [regex]::Escape($oldLoadDepartments), $newLoadDepartments

# Write back to file
Set-Content $filePath $content -Encoding UTF8

Write-Host "✅ Department loading logs added successfully!"
