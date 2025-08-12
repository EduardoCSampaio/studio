
"use client"

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { Camera } from 'lucide-react';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [newPhoto, setNewPhoto] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setNewPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!newPhoto || !user) return;

    setIsUploading(true);
    try {
      const filePath = `profile-pictures/${user.id}/${newPhoto.name}`;
      const storageRef = ref(storage, filePath);
      const uploadResult = await uploadBytes(storageRef, newPhoto);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        photoURL: downloadURL,
      });

      setNewPhoto(null);
      setPhotoPreview(null);
      toast({
        title: 'Sucesso!',
        description: 'Sua foto de perfil foi atualizada.',
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no Upload',
        description: 'Não foi possível salvar sua nova foto de perfil.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-headline font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações de perfil.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>
            Esta foto será exibida em seu perfil e para outros usuários no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative">
            <Avatar className="h-32 w-32">
              <AvatarImage src={photoPreview || user.photoURL} alt={user.name} />
              <AvatarFallback className="text-4xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-1 right-1 rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-5 w-5" />
              <span className="sr-only">Alterar foto</span>
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleFileChange}
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-semibold">{user.name}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            <p className="text-sm font-medium text-primary mt-1">{user.role}</p>
          </div>
        </CardContent>
        {photoPreview && (
          <CardFooter className="justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setNewPhoto(null);
                setPhotoPreview(null);
                if(fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isUploading}>
              {isUploading ? 'Salvando...' : 'Salvar Nova Foto'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
