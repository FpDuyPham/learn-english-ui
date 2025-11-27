# Fix Exercise Domain Imports
(Get-Content 'src\app\domains\exercise\feature\passive-listening\exercise-passive-listening.component.ts') -replace "from '../../core/exercise.service'", "from '../../data/exercise.service'" -replace "from '../../core/db-schema'", "from '../../../../core/db-schema'" -replace "from '../../core/setence.service'", "from '../../../../core/setence.service'" | Set-Content 'src\app\domains\exercise\feature\passive-listening\exercise-passive-listening.component.ts'

(Get-Content 'src\app\domains\exercise\feature\exercise-list\exercise-list.component.ts') -replace "from '../../core/exercise.service'", "from '../../data/exercise.service'" -replace "from '../../core/db-schema'", "from '../../../../core/db-schema'" | Set-Content 'src\app\domains\exercise\feature\exercise-list\exercise-list.component.ts'

(Get-Content 'src\app\domains\exercise\feature\exercise-edit\exercise-edit.component.ts') -replace "from '../../core/db-schema'", "from '../../../../core/db-schema'" -replace "from '../../core/exercise.service'", "from '../../data/exercise.service'" | Set-Content 'src\app\domains\exercise\feature\exercise-edit\exercise-edit.component.ts'

(Get-Content 'src\app\domains\exercise\feature\exercise-create\exercise-create.component.ts') -replace "from '../../core/exercise.service'", "from '../../data/exercise.service'" | Set-Content 'src\app\domains\exercise\feature\exercise-create\exercise-create.component.ts'

(Get-Content 'src\app\domains\exercise\feature\audio-splitter\upload-file\upload-file.component.ts') -replace "from '../../core/audio.service'", "from '../../../../data/audio.service'" | Set-Content 'src\app\domains\exercise\feature\audio-splitter\upload-file\upload-file.component.ts'

# Fix Shadowing Domain Imports
(Get-Content 'src\app\domains\shadowing\feature\trainer\shadowing-trainer.component.ts') -replace "from '../../../core/models/shadowing.models'", "from '../../models/shadowing.models'" | Set-Content 'src\app\domains\shadowing\feature\trainer\shadowing-trainer.component.ts'

(Get-Content 'src\app\domains\shadowing\feature\article-list\shadowing-article-list.component.ts') -replace "from '../../../core/models/shadowing.models'", "from '../../models/shadowing.models'" | Set-Content 'src\app\domains\shadowing\feature\article-list\shadowing-article-list.component.ts'

# Fix IPA UI imports  
(Get-Content 'src\app\domains\ipa\ui\ipa-practice\ipa-practice.component.ts') -replace "from '../../../core/ipa-data.service'", "from '../../data/ipa-data.service'" | Set-Content 'src\app\domains\ipa\ui\ipa-practice\ipa-practice.component.ts'

(Get-Content 'src\app\domains\ipa\ui\ipa-detail\ipa-detail.component.ts') -replace "from '../../../core/ipa-data.service'", "from '../../data/ipa-data.service'" | Set-Content 'src\app\domains\ipa\ui\ipa-detail\ipa-detail.component.ts'

# Fix Admin imports
(Get-Content 'src\app\domains\admin\feature\lesson-generator\lesson-generator.component.ts') -replace "from '../../../core/services/whisper.service'", "from '../../data/whisper.service'" | Set-Content 'src\app\domains\admin\feature\lesson-generator\lesson-generator.component.ts'

Write-Host "All imports fixed!" -ForegroundColor Green
